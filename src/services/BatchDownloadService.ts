import { StreamData, processExternalStreams, StreamSource } from '../utils/streamUtils';

const API_BASE = 'https://02moviedownloader.xyz/api/download';

/**
 * Fetch stream source for a single TV episode
 */
export async function fetchEpisodeStreams(
    showId: string | number,
    season: number,
    episode: number
): Promise<{ sources: StreamSource[]; error?: string }> {
    try {
        const response = await fetch(`${API_BASE}/tv/${showId}/${season}/${episode}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Handle nested response structure
        const downloadData = data.data?.downloadData?.data ||
            data.downloadData?.data ||
            data.data ||
            data;

        const parsedStreams: StreamData = {
            downloads: downloadData.downloads || [],
            captions: downloadData.captions || [],
            externalStreams: data.externalStreams || [],
            hasResource: downloadData.hasResource ?? true,
        };

        // Process external streams to get download sources
        const sources = processExternalStreams(parsedStreams.externalStreams);

        return { sources };
    } catch (err) {
        console.error(`Error fetching streams for S${season}E${episode}:`, err);
        return { sources: [], error: err instanceof Error ? err.message : 'Failed to fetch streams' };
    }
}

/**
 * Batch download configuration for a season
 */
export interface BatchDownloadConfig {
    showId: string | number;
    showTitle: string;
    posterUrl: string;
    season: number;
    episodes: Array<{
        episodeNumber: number;
        title?: string;
    }>;
    preferredQuality?: '480' | '720' | '1080' | 'auto';
}

/**
 * Batch download progress callback
 */
export interface BatchDownloadProgress {
    totalEpisodes: number;
    currentEpisode: number;
    episodeTitle: string;
    status: 'fetching' | 'downloading' | 'completed' | 'failed' | 'skipped';
    error?: string;
}
