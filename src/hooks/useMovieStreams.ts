import { useState, useEffect, useCallback } from 'react';
import { StreamData, ExternalStream, Caption } from '../utils/streamUtils';

const API_BASE = 'https://02moviedownloader.site/api/download';

interface UseMovieStreamsResult {
    streams: StreamData | null;
    loading: boolean;
    error: string | null;
    hasFetched: boolean;
    refetch: () => void;
}

/**
 * Hook to fetch movie streaming data from the download API
 * @param movieId - TMDB movie ID
 */
export function useMovieStreams(movieId: string | number): UseMovieStreamsResult {
    const [streams, setStreams] = useState<StreamData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasFetched, setHasFetched] = useState(false);

    const fetchStreams = useCallback(async () => {
        if (!movieId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/movie/${movieId}`);

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
            console.error('Error fetching movie streams:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch streams');
            setStreams(null);
        } finally {
            setLoading(false);
        }
    }, [movieId]);

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
