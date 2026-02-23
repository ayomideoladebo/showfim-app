import { useState, useEffect, useCallback } from 'react';
import { StreamData, Caption, MOVIEBOX_API_BASE, getProxiedSubtitleUrl } from '../utils/streamUtils';

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
            const response = await fetch(`${MOVIEBOX_API_BASE}/api/download/movie/${movieId}`);

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
