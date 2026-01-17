import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TMDBMovie, TMDBTVShow } from '../types/tmdb';
import { getRecommendedMovies, getRecommendedTV, getPopularMovies, getPopularTV } from '../services/tmdb';

const WATCH_HISTORY_KEY = 'showfim_watch_history_v1';

interface WatchHistoryItem {
    id: number;
    type: 'movie' | 'tv';
    watchedAt: number;
}

interface RecommendationItem {
    id: number;
    type: 'movie' | 'tv';
    title: string;
    poster_path: string | null;
    backdrop_path?: string | null;
    vote_average: number;
    // Original movie or TV data
    data: TMDBMovie | TMDBTVShow;
}

/**
 * Hook for fetching personalized recommendations based on watch history
 * Falls back to popular content if no watch history exists
 */
export function useRecommendations(excludeIds: number[] = []) {
    const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasWatchHistory, setHasWatchHistory] = useState(false);

    const fetchRecommendations = useCallback(async () => {
        try {
            setLoading(true);

            // Load watch history
            const stored = await AsyncStorage.getItem(WATCH_HISTORY_KEY);
            const historyItems: WatchHistoryItem[] = stored ? JSON.parse(stored).items || [] : [];

            // Get unique movie and TV IDs from history
            const movieIds = [...new Set(historyItems.filter(h => h.type === 'movie').map(h => h.id))].slice(0, 3);
            const tvIds = [...new Set(historyItems.filter(h => h.type === 'tv').map(h => h.id))].slice(0, 3);

            const hasHistory = movieIds.length > 0 || tvIds.length > 0;
            setHasWatchHistory(hasHistory);

            let allRecommendations: RecommendationItem[] = [];

            if (hasHistory) {
                // Fetch recommendations based on watch history
                const moviePromises = movieIds.map(async (id) => {
                    try {
                        return await getRecommendedMovies(id);
                    } catch (e) {
                        console.log(`Failed to get recommendations for movie ${id}`);
                        return [];
                    }
                });

                const tvPromises = tvIds.map(async (id) => {
                    try {
                        return await getRecommendedTV(id);
                    } catch (e) {
                        console.log(`Failed to get recommendations for TV ${id}`);
                        return [];
                    }
                });

                const [movieResults, tvResults] = await Promise.all([
                    Promise.all(moviePromises),
                    Promise.all(tvPromises)
                ]);

                // Flatten and convert to unified format
                const movieRecs = movieResults.flat().map(movie => ({
                    id: movie.id,
                    type: 'movie' as const,
                    title: movie.title,
                    poster_path: movie.poster_path,
                    backdrop_path: movie.backdrop_path,
                    vote_average: movie.vote_average,
                    data: movie
                }));

                const tvRecs = tvResults.flat().map(tv => ({
                    id: tv.id,
                    type: 'tv' as const,
                    title: tv.name,
                    poster_path: tv.poster_path,
                    backdrop_path: tv.backdrop_path,
                    vote_average: tv.vote_average,
                    data: tv
                }));

                // Merge and shuffle
                allRecommendations = [...movieRecs, ...tvRecs];
            } else {
                // No watch history - fall back to popular content
                const [popularMovies, popularTV] = await Promise.all([
                    getPopularMovies(),
                    getPopularTV()
                ]);

                const movieRecs = popularMovies.slice(0, 10).map(movie => ({
                    id: movie.id,
                    type: 'movie' as const,
                    title: movie.title,
                    poster_path: movie.poster_path,
                    backdrop_path: movie.backdrop_path,
                    vote_average: movie.vote_average,
                    data: movie
                }));

                const tvRecs = popularTV.slice(0, 10).map(tv => ({
                    id: tv.id,
                    type: 'tv' as const,
                    title: tv.name,
                    poster_path: tv.poster_path,
                    backdrop_path: tv.backdrop_path,
                    vote_average: tv.vote_average,
                    data: tv
                }));

                allRecommendations = [...movieRecs, ...tvRecs];
            }

            // Deduplicate by ID and type
            const seen = new Set<string>();
            const unique = allRecommendations.filter(item => {
                const key = `${item.type}-${item.id}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            // Exclude items already shown on home screen
            const excludeSet = new Set(excludeIds);
            const filtered = unique.filter(item => !excludeSet.has(item.id));

            // Shuffle for variety
            const shuffled = filtered.sort(() => Math.random() - 0.5);

            // Take top 20
            setRecommendations(shuffled.slice(0, 20));
        } catch (e) {
            console.error('Error fetching recommendations:', e);
            setRecommendations([]);
        } finally {
            setLoading(false);
        }
    }, [excludeIds.join(',')]);

    useEffect(() => {
        fetchRecommendations();
    }, [fetchRecommendations]);

    return {
        recommendations,
        loading,
        hasWatchHistory,
        refresh: fetchRecommendations,
    };
}
