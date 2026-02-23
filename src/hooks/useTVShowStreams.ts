import { useState, useEffect, useCallback } from 'react';
import { StreamData, Caption, MOVIEBOX_API_BASE, getProxiedSubtitleUrl } from '../utils/streamUtils';

interface UseTVShowStreamsResult {
    streams: StreamData | null;
    loading: boolean;
    error: string | null;
    hasFetched: boolean;
    refetch: () => void;
}

/**
 * Hook to fetch TV show episode streaming data from the download API
 * @param showId - TMDB TV show ID
 * @param season - Season number
 * @param episode - Episode number
 */
export function useTVShowStreams(
    showId: string | number,
    season: number,
    episode: number
): UseTVShowStreamsResult {
    const [streams, setStreams] = useState<StreamData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasFetched, setHasFetched] = useState(false);

    const fetchStreams = useCallback(async () => {
        if (!showId || !season || !episode) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${MOVIEBOX_API_BASE}/api/download/tv/${showId}/${season}/${episode}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Handle nested response structure
            const downloadData = data.data?.downloadData?.data ||
                data.downloadData?.data ||
                data.data ||
                data;

            // Process captions to use proxy URLs
            const rawCaptions = downloadData.captions || [];
            const proxiedCaptions: Caption[] = rawCaptions.map((cap: any) => ({
                ...cap,
                url: cap.url ? getProxiedSubtitleUrl(cap.url) : cap.url
            }));

            const parsedStreams: StreamData = {
                downloads: downloadData.downloads || [],
                captions: proxiedCaptions,
                externalStreams: data.externalStreams || [], // At ROOT level
                hasResource: downloadData.hasResource ?? true,
            };

            setStreams(parsedStreams);
            setHasFetched(true);
        } catch (err) {
            console.error('Error fetching TV show streams:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch streams');
            setStreams(null);
        } finally {
            setLoading(false);
        }
    }, [showId, season, episode]);

    useEffect(() => {
        fetchStreams();
    }, [fetchStreams]);

    return {
        streams,
        loading,
        error,
        hasFetched,
        refetch: fetchStreams,
    };
}
