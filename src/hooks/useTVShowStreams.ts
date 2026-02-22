import { useState, useEffect, useCallback } from 'react';
import { StreamData } from '../utils/streamUtils';

const API_BASE = 'https://02moviedownloader.site/api/download';

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
