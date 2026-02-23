// Stream utility functions for filtering, prioritizing, and processing stream sources
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StreamSource {
    id: string;
    url: string; // The URL to use for streaming (proxy)
    downloadUrl?: string; // The URL to use for downloading (proxy)
    quality: string;
    resolution: number;
    size: string;
    name?: string;
}

export interface ExternalStream {
    name: string;
    title: string;
    url: string;
    quality: string;
    size: string | null;
    type: string;
    filename?: string;
}

export interface Caption {
    id?: string;
    lan: string;
    lanName: string;
    url: string;
    size?: number;
    delay?: number;
}

export interface StreamData {
    downloads: any[];
    captions: Caption[];
    externalStreams: ExternalStream[];
    hasResource: boolean;
}

// Base URL for the new Azure Proxy API
export const MOVIEBOX_API_BASE = 'https://showfim-api-cnetghdfc6e5f4df.southindia-01.azurewebsites.net';

// Excluded sources (poor quality/unreliable)
const EXCLUDED_SOURCES = ['DahmerMovies'];

// Prioritized sources (best quality/reliable)
const PRIORITIZED_SOURCES = ['FzMovies'];

/**
 * Get proxied stream URL for in-browser/app streaming with Range support
 */
export function getProxiedStreamUrl(originalUrl: string): string {
    if (!originalUrl) return '';
    return `${MOVIEBOX_API_BASE}/api/proxy/stream?url=${encodeURIComponent(originalUrl)}`;
}

/**
 * Get proxied download URL for downloading the file to device
 */
export function getProxiedDownloadUrl(originalUrl: string, filename?: string): string {
    if (!originalUrl) return '';
    let url = `${MOVIEBOX_API_BASE}/api/proxy/download?url=${encodeURIComponent(originalUrl)}`;
    if (filename) {
        url += `&filename=${encodeURIComponent(filename)}`;
    }
    return url;
}

/**
 * Get proxied subtitle URL to bypass CORS
 */
export function getProxiedSubtitleUrl(originalUrl: string): string {
    if (!originalUrl) return '';
    return `${MOVIEBOX_API_BASE}/api/proxy/subtitle?url=${encodeURIComponent(originalUrl)}`;
}

/**
 * Filter out excluded sources like DahmerMovies
 */
export function filterExternalStreams(streams: ExternalStream[]): ExternalStream[] {
    return streams.filter(stream => !EXCLUDED_SOURCES.includes(stream.name));
}

/**
 * Sort streams with prioritized sources first (FzMovies)
 */
export function prioritizeStreams(streams: ExternalStream[]): ExternalStream[] {
    return [...streams].sort((a, b) => {
        const aIsPrioritized = PRIORITIZED_SOURCES.includes(a.name);
        const bIsPrioritized = PRIORITIZED_SOURCES.includes(b.name);

        if (aIsPrioritized && !bIsPrioritized) return -1;
        if (!aIsPrioritized && bIsPrioritized) return 1;

        // Secondary sort by quality (higher first)
        const aQuality = parseInt(a.quality) || 0;
        const bQuality = parseInt(b.quality) || 0;
        return bQuality - aQuality;
    });
}

/**
 * Deduplicate streams keeping only one per resolution
 */
export function deduplicateByQuality(streams: ExternalStream[]): StreamSource[] {
    const seenResolutions = new Set<number>();
    const result: StreamSource[] = [];

    for (const stream of streams) {
        const resolution = parseInt(stream.quality) || 720;

        if (!seenResolutions.has(resolution)) {
            seenResolutions.add(resolution);
            result.push({
                id: `${stream.name}-${stream.quality}-${result.length}`,
                url: stream.url,
                quality: stream.quality,
                resolution,
                size: stream.size || 'Unknown',
                name: stream.name,
            });
        }
    }

    return result;
}

/**
 * Process external streams: filter, prioritize, and deduplicate
 * Note: External streams are M3U8/HLS playlists which don't need proxying
 * in the same way MP4s do, but they might need specific headers if played directly.
 * For now, returning as is since they usually just work in standard players if referrer is ignored,
 * but if they fail, further proxying might be needed.
 */
export function processExternalStreams(streams: ExternalStream[]): StreamSource[] {
    const filtered = filterExternalStreams(streams);
    const prioritized = prioritizeStreams(filtered);
    const deduplicated = deduplicateByQuality(prioritized);
    return deduplicated;
}

/**
 * Process direct MP4 downloads from the new API
 * Generates properly proxied URLs for streaming and downloading
 */
export function processDownloads(downloads: any[], title?: string): StreamSource[] {
    if (!downloads || !Array.isArray(downloads)) return [];

    return downloads.map((download, index) => {
        // Parse quality string (e.g., "1080", "720") to number
        const resolution = parseInt(download.quality) || 720;

        // Generate a filename if title is provided
        const filename = title ? `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${resolution}p.mp4` : undefined;

        return {
            id: download.id || `download-${resolution}-${index}`,
            url: getProxiedStreamUrl(download.url),
            downloadUrl: getProxiedDownloadUrl(download.url, filename),
            quality: download.quality + 'p',
            resolution: resolution,
            size: download.size || 'Unknown',
            name: 'Direct MP4'
        };
    }).sort((a, b) => b.resolution - a.resolution); // Highest quality first
}

// Playback progress storage
const PROGRESS_STORAGE_KEY = 'showfim_playback_progress';

interface PlaybackProgress {
    time: number;
    duration: number;
    updatedAt: number;
}

interface ProgressStorage {
    [contentId: string]: PlaybackProgress;
}

/**
 * Get saved playback progress for a content item
 */
export async function getPlaybackProgress(contentId: string): Promise<PlaybackProgress | null> {
    try {
        const stored = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
        if (!stored) return null;

        const progress: ProgressStorage = JSON.parse(stored);
        return progress[contentId] || null;
    } catch {
        return null;
    }
}

/**
 * Save playback progress for resume functionality
 */
export async function savePlaybackProgress(contentId: string, time: number, duration: number): Promise<void> {
    try {
        const stored = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
        const progress: ProgressStorage = stored ? JSON.parse(stored) : {};

        progress[contentId] = {
            time,
            duration,
            updatedAt: Date.now(),
        };

        await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
        console.error('Error saving playback progress:', error);
    }
}

/**
 * Clear playback progress for a content item
 */
export async function clearPlaybackProgress(contentId: string): Promise<void> {
    try {
        const stored = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
        if (!stored) return;

        const progress: ProgressStorage = JSON.parse(stored);
        delete progress[contentId];
        await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
        console.error('Error clearing playback progress:', error);
    }
}

/**
 * Format seconds to mm:ss or hh:mm:ss
 */
export function formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) return '0:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get quality label from resolution
 */
export function getQualityLabel(resolution: number): string {
    if (resolution >= 2160) return '4K';
    if (resolution >= 1440) return '2K';
    if (resolution >= 1080) return 'HD';
    if (resolution >= 720) return 'HD';
    if (resolution >= 480) return 'SD';
    return 'Low';
}
