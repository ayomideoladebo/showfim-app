import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DOWNLOADS_KEY = 'showfim_downloads_v1';
// @ts-ignore
const DOWNLOAD_DIR = (FileSystem.documentDirectory || 'file:///data/user/0/host.exp.exponent/files/') + 'downloads/';

export interface DownloadItem {
    id: string; // unique (movieId_quality or movieId_season_ep_quality)
    contentId: string; // movieId or tvId
    title: string;
    posterUrl: string;
    type: 'movie' | 'tv';
    season?: number;
    episode?: number;
    quality: string;
    uri: string; // local file uri
    remoteUrl: string;
    size: string;
    progress: number;
    status: 'downloading' | 'paused' | 'completed' | 'failed';
    date: string;
    resumeData?: string; // Expo Resumable data
}

class DownloadManager {
    private downloads: DownloadItem[] = [];
    private downloadResumables: Record<string, any> = {};
    private listeners: ((downloads: DownloadItem[]) => void)[] = [];

    constructor() {
        this.init();
    }

    private async init() {
        try {
            // Ensure directory exists
            const dirInfo = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true });
            }

            // Load metadata
            const saved = await AsyncStorage.getItem(DOWNLOADS_KEY);
            if (saved) {
                this.downloads = JSON.parse(saved);
                // Mark interrupted downloads as paused (not failed) so they can be resumed
                this.downloads = this.downloads.map(d => {
                    if (d.status === 'downloading') {
                        // Check if partial file exists and preserve progress
                        return { ...d, status: 'paused' as const };
                    }
                    return d;
                });
                await this.persist();
                this.notifyListeners();

                // Clean up orphaned partial files (files with no metadata)
                this.cleanupOrphanedFiles();
            }
        } catch (e) {
            console.error('DownloadManager init error:', e);
        }
    }

    private async cleanupOrphanedFiles() {
        try {
            const files = await FileSystem.readDirectoryAsync(DOWNLOAD_DIR);
            const knownIds = new Set(this.downloads.map(d => d.id));

            for (const file of files) {
                const fileId = file.replace('.mp4', '').replace('.tmp', '');
                if (!knownIds.has(fileId)) {
                    // Orphaned file - delete it
                    await FileSystem.deleteAsync(DOWNLOAD_DIR + file, { idempotent: true });
                    console.log('Cleaned up orphaned file:', file);
                }
            }
        } catch (e) {
            console.log('Cleanup error (non-fatal):', e);
        }
    }

    // --- Public API ---

    public getDownloads() {
        return this.downloads;
    }

    public subscribe(listener: (downloads: DownloadItem[]) => void) {
        this.listeners.push(listener);
        listener(this.downloads); // Initial emit
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    public async startDownload(
        item: Omit<DownloadItem, 'status' | 'progress' | 'date' | 'uri' | 'resumeData'>
    ) {
        const existing = this.downloads.find(d => d.id === item.id);
        if (existing && existing.status === 'completed') {
            console.log('Already downloaded:', item.title);
            return;
        }

        const downloadDate = new Date().toISOString();
        const localUri = DOWNLOAD_DIR + `${item.id}.mp4`;

        const newDownload: DownloadItem = {
            ...item,
            status: 'downloading',
            progress: 0,
            date: downloadDate,
            uri: localUri,
        };

        if (existing) {
            // Retry logic: update existing entry
            this.downloads = this.downloads.map(d => d.id === item.id ? newDownload : d);
        } else {
            this.downloads.push(newDownload);
        }

        this.notifyListeners();
        this.persist();

        // Start Expo Download
        const resumable = FileSystem.createDownloadResumable(
            item.remoteUrl,
            localUri,
            {},
            (progress) => {
                const percent = progress.totalBytesExpectedToWrite
                    ? progress.totalBytesWritten / progress.totalBytesExpectedToWrite
                    : 0;
                this.updateProgress(item.id, percent);
            }
        );

        this.downloadResumables[item.id] = resumable;

        try {
            const result = await resumable.downloadAsync();
            if (result && result.uri) {
                this.completeDownload(item.id, result.uri);
            }
        } catch (e) {
            console.error('Download failed:', e);
            this.failDownload(item.id);
        }
    }

    public async pauseDownload(id: string) {
        const resumable = this.downloadResumables[id];
        if (resumable) {
            try {
                await resumable.pauseAsync();
                const resumeData = JSON.stringify(resumable.savable());
                this.updateStatus(id, 'paused', resumeData);
            } catch (e) {
                console.error('Pause failed:', e);
            }
        }
    }

    public async resumeDownload(id: string) {
        const item = this.downloads.find(d => d.id === id);
        if (!item || (item.status !== 'paused' && item.status !== 'failed')) return;

        // Update status to downloading
        this.downloads = this.downloads.map(d =>
            d.id === id ? { ...d, status: 'downloading' as const } : d
        );
        this.notifyListeners();
        this.persist();

        // Check if we have resume data and partial file exists
        let resumable: any = null;

        if (item.resumeData) {
            try {
                const savedData = JSON.parse(item.resumeData);
                // Check if partial file exists
                const fileInfo = await FileSystem.getInfoAsync(item.uri);

                if (fileInfo.exists) {
                    // Create resumable from saved data
                    resumable = new (FileSystem as any).DownloadResumable(
                        savedData.url,
                        savedData.fileUri,
                        savedData.options || {},
                        (progress: any) => {
                            const percent = progress.totalBytesExpectedToWrite
                                ? progress.totalBytesWritten / progress.totalBytesExpectedToWrite
                                : 0;
                            this.updateProgress(id, percent);
                        },
                        savedData.resumeData
                    );
                }
            } catch (e) {
                console.log('Could not restore resumable, will restart:', e);
            }
        }

        // If no resumable, create a new one (restart download)
        if (!resumable) {
            resumable = FileSystem.createDownloadResumable(
                item.remoteUrl,
                item.uri,
                {},
                (progress) => {
                    const percent = progress.totalBytesExpectedToWrite
                        ? progress.totalBytesWritten / progress.totalBytesExpectedToWrite
                        : 0;
                    this.updateProgress(id, percent);
                }
            );
        }

        this.downloadResumables[id] = resumable;

        try {
            const result = await resumable.resumeAsync();
            if (result && result.uri) {
                this.completeDownload(id, result.uri);
            } else {
                // If resume fails, try download fresh
                const freshResult = await resumable.downloadAsync();
                if (freshResult && freshResult.uri) {
                    this.completeDownload(id, freshResult.uri);
                }
            }
        } catch (e) {
            console.error('Resume/Download failed:', e);
            this.failDownload(id);
        }
    }

    public async deleteDownload(id: string) {
        const item = this.downloads.find(d => d.id === id);
        if (item) {
            // 1. Remove file
            try {
                await FileSystem.deleteAsync(item.uri, { idempotent: true });
            } catch (e) {
                console.warn('File delete failed (might verify existence)', e);
            }

            // 2. Stop active download
            const resumable = this.downloadResumables[id];
            if (resumable) {
                try { await resumable.cancelAsync(); } catch { }
                delete this.downloadResumables[id];
            }

            // 3. Update state
            this.downloads = this.downloads.filter(d => d.id !== id);
            this.notifyListeners();
            this.persist();
        }
    }

    public async clearAll() {
        try {
            await FileSystem.deleteAsync(DOWNLOAD_DIR, { idempotent: true });
            await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true });
            this.downloads = [];
            this.notifyListeners();
            this.persist();
        } catch (e) { console.error(e); }
    }

    // --- Helpers ---

    private lastPersistTime: number = 0;
    private progressUpdateCount: number = 0;

    private updateProgress(id: string, progress: number) {
        this.downloads = this.downloads.map(d =>
            d.id === id ? { ...d, progress: progress * 100 } : d
        );
        this.notifyListeners();

        // Persist progress periodically (every 10 updates or every 5 seconds)
        this.progressUpdateCount++;
        const now = Date.now();
        if (this.progressUpdateCount >= 10 || now - this.lastPersistTime > 5000) {
            this.persist();
            this.lastPersistTime = now;
            this.progressUpdateCount = 0;
        }
    }

    private completeDownload(id: string, uri: string) {
        this.downloads = this.downloads.map(d =>
            d.id === id ? { ...d, status: 'completed', progress: 100, uri } : d
        );
        delete this.downloadResumables[id];
        this.persist();
        this.notifyListeners();
    }

    private failDownload(id: string) {
        this.downloads = this.downloads.map(d =>
            d.id === id ? { ...d, status: 'failed', progress: 0 } : d
        );
        delete this.downloadResumables[id];
        this.persist();
        this.notifyListeners();
    }

    private updateStatus(id: string, status: DownloadItem['status'], resumeData?: string) {
        this.downloads = this.downloads.map(d =>
            d.id === id ? { ...d, status, resumeData } : d
        );
        this.persist();
        this.notifyListeners();
    }

    private notifyListeners() {
        this.listeners.forEach(l => l(this.downloads));
    }

    private async persist() {
        try {
            await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(this.downloads));
        } catch (e) {
            console.error('Failed to persist downloads', e);
        }
    }
}

export const downloadManager = new DownloadManager();
