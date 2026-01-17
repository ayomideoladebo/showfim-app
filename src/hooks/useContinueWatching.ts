import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMovieDetails, getTVDetails, getPosterUrl } from '../services/tmdb';

const PROGRESS_STORAGE_KEY = 'showfim_playback_progress';
const CONTINUE_WATCHING_KEY = 'showfim_continue_watching';

interface PlaybackProgress {
    time: number;
    duration: number;
    updatedAt: number;
}

interface ProgressStorage {
    [contentId: string]: PlaybackProgress;
}

export interface ContinueWatchingItem {
    id: number;
    type: 'movie' | 'tv';
    title: string;
    posterPath: string;
    backdropPath?: string;
    progress: number; // Percentage 0-100
    currentTime: number; // Seconds
    duration: number; // Seconds
    updatedAt: number;
    season?: number;
    episode?: number;
}

export function useContinueWatching() {
    const [items, setItems] = useState<ContinueWatchingItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Load continue watching items on mount
    useEffect(() => {
        loadContinueWatching();
    }, []);

    const loadContinueWatching = async () => {
        try {
            setLoading(true);

            // Try to load cached enriched data first
            const cached = await AsyncStorage.getItem(CONTINUE_WATCHING_KEY);
            if (cached) {
                const cachedItems: ContinueWatchingItem[] = JSON.parse(cached);
                // Filter out items older than 30 days
                const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
                const recentItems = cachedItems.filter(i => i.updatedAt > thirtyDaysAgo);
                setItems(recentItems);
            }

            // Load raw progress data and sync
            const progressData = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
            if (progressData) {
                const progress: ProgressStorage = JSON.parse(progressData);
                await enrichProgressData(progress);
            }
        } catch (e) {
            console.error('Error loading continue watching:', e);
        } finally {
            setLoading(false);
        }
    };

    const enrichProgressData = async (progress: ProgressStorage) => {
        const enrichedItems: ContinueWatchingItem[] = [];

        for (const [contentId, data] of Object.entries(progress)) {
            // Skip items that are nearly finished (>95%)
            const progressPercent = (data.time / data.duration) * 100;
            if (progressPercent > 95 || progressPercent < 5) continue;

            // Parse contentId format: "movie-123" or "tv-456-s1-e2"
            const parts = contentId.split('-');
            const type = parts[0] as 'movie' | 'tv';
            const id = parseInt(parts[1]);

            if (isNaN(id)) continue;

            try {
                let title = '';
                let posterPath = '';
                let backdropPath = '';
                let season: number | undefined;
                let episode: number | undefined;

                if (type === 'movie') {
                    const movieData = await getMovieDetails(id);
                    title = movieData.title;
                    posterPath = movieData.poster_path || '';
                    backdropPath = movieData.backdrop_path || '';
                } else {
                    const tvData = await getTVDetails(id);
                    title = tvData.name;
                    posterPath = tvData.poster_path || '';
                    backdropPath = tvData.backdrop_path || '';

                    // Extract season/episode if present
                    if (parts.length >= 4) {
                        season = parseInt(parts[2].replace('s', ''));
                        episode = parseInt(parts[3].replace('e', ''));
                        if (!isNaN(season) && !isNaN(episode)) {
                            title = `${title} - S${season}:E${episode}`;
                        }
                    }
                }

                enrichedItems.push({
                    id,
                    type,
                    title,
                    posterPath,
                    backdropPath,
                    progress: progressPercent,
                    currentTime: data.time,
                    duration: data.duration,
                    updatedAt: data.updatedAt,
                    season,
                    episode,
                });
            } catch (e) {
                // Skip items we can't fetch data for
                console.log(`Skipping ${contentId}: unable to fetch metadata`);
            }
        }

        // Sort by most recently watched
        enrichedItems.sort((a, b) => b.updatedAt - a.updatedAt);

        // Keep only top 10
        const topItems = enrichedItems.slice(0, 10);

        // Cache enriched data
        await AsyncStorage.setItem(CONTINUE_WATCHING_KEY, JSON.stringify(topItems));
        setItems(topItems);
    };

    const removeItem = useCallback(async (id: number, type: 'movie' | 'tv') => {
        // Remove from continue watching list
        const updated = items.filter(i => !(i.id === id && i.type === type));
        setItems(updated);
        await AsyncStorage.setItem(CONTINUE_WATCHING_KEY, JSON.stringify(updated));

        // Also remove from raw progress storage
        const progressData = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
        if (progressData) {
            const progress: ProgressStorage = JSON.parse(progressData);
            const contentId = type === 'movie' ? `movie-${id}` : `tv-${id}`;
            // Find and delete any matching keys (might have season/episode suffix)
            for (const key of Object.keys(progress)) {
                if (key.startsWith(contentId)) {
                    delete progress[key];
                }
            }
            await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
        }
    }, [items]);

    const refresh = useCallback(() => {
        loadContinueWatching();
    }, []);

    return {
        items,
        loading,
        removeItem,
        refresh,
    };
}
