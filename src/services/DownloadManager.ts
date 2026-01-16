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
                // Reset downloading items to failed/paused on restart to prevent stale UI
                this.downloads = this.downloads.map(d =>
                    d.status === 'downloading' ? { ...d, status: 'failed' } : d
                );
                this.notifyListeners();
            }
        } catch (e) {
            console.error('DownloadManager init error:', e);
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
        if (!item || item.status !== 'paused' || !item.resumeData) return;

        // TODO: Expo resume logic needs reconstruction of Resumable
        // For simplicity in MVP, we might just restart or need simpler resume
        // Re-creating resumable from data:
        /*
          const resumable = new FileSystem.DownloadResumable(
            item.remoteUrl,
            item.uri,
            {},
            callback,
            JSON.parse(item.resumeData)
          );
        */
        // Implementing restart for now as it's safer for MVP
        const { status, progress, date, uri, resumeData, ...originalItem } = item;
        this.startDownload(originalItem);
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

    private updateProgress(id: string, progress: number) {
        // Only update state occasionally to avoid spamming re-renders
        // Or just update directly
        this.downloads = this.downloads.map(d =>
            d.id === id ? { ...d, progress: progress * 100 } : d
        );
        // Optimization: Don't persist on every progress tick, only in memory
        // this.persist(); // Too expensive
        this.notifyListeners();
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
