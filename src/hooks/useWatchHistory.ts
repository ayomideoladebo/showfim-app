import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WATCH_HISTORY_KEY = 'showfim_watch_history_v1';
const MAX_HISTORY_ITEMS = 20;

export interface WatchHistoryItem {
    id: number;
    type: 'movie' | 'tv';
    watchedAt: number;
    title?: string;
    posterPath?: string;
}

interface WatchHistoryStorage {
    items: WatchHistoryItem[];
}

/**
 * Hook for managing user watch history
 * Tracks movies and TV shows the user has watched
 */
export function useWatchHistory() {
    const [history, setHistory] = useState<WatchHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Load history on mount
    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const stored = await AsyncStorage.getItem(WATCH_HISTORY_KEY);
            if (stored) {
                const data: WatchHistoryStorage = JSON.parse(stored);
                setHistory(data.items || []);
            }
        } catch (e) {
            console.error('Error loading watch history:', e);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Add an item to watch history
     * If already exists, updates the timestamp
     */
    const addToHistory = useCallback(async (item: Omit<WatchHistoryItem, 'watchedAt'>) => {
        try {
            const stored = await AsyncStorage.getItem(WATCH_HISTORY_KEY);
            let items: WatchHistoryItem[] = stored ? JSON.parse(stored).items || [] : [];

            // Remove if already exists (to move to top)
            items = items.filter(h => !(h.id === item.id && h.type === item.type));

            // Add new item at the beginning
            const newItem: WatchHistoryItem = {
                ...item,
                watchedAt: Date.now(),
            };
            items.unshift(newItem);

            // Keep only most recent items
            items = items.slice(0, MAX_HISTORY_ITEMS);

            // Save
            await AsyncStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify({ items }));
            setHistory(items);

            return true;
        } catch (e) {
            console.error('Error adding to watch history:', e);
            return false;
        }
    }, []);

    /**
     * Remove an item from watch history
     */
    const removeFromHistory = useCallback(async (id: number, type: 'movie' | 'tv') => {
        try {
            const stored = await AsyncStorage.getItem(WATCH_HISTORY_KEY);
            if (!stored) return;

            let items: WatchHistoryItem[] = JSON.parse(stored).items || [];
            items = items.filter(h => !(h.id === id && h.type === type));

            await AsyncStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify({ items }));
            setHistory(items);
        } catch (e) {
            console.error('Error removing from watch history:', e);
        }
    }, []);

    /**
     * Clear all watch history
     */
    const clearHistory = useCallback(async () => {
        try {
            await AsyncStorage.removeItem(WATCH_HISTORY_KEY);
            setHistory([]);
        } catch (e) {
            console.error('Error clearing watch history:', e);
        }
    }, []);

    /**
     * Get recent movie IDs from history
     */
    const getRecentMovieIds = useCallback((limit: number = 5): number[] => {
        return history
            .filter(h => h.type === 'movie')
            .slice(0, limit)
            .map(h => h.id);
    }, [history]);

    /**
     * Get recent TV show IDs from history
     */
    const getRecentTvIds = useCallback((limit: number = 5): number[] => {
        return history
            .filter(h => h.type === 'tv')
            .slice(0, limit)
            .map(h => h.id);
    }, [history]);

    return {
        history,
        loading,
        addToHistory,
        removeFromHistory,
        clearHistory,
        getRecentMovieIds,
        getRecentTvIds,
        refresh: loadHistory,
    };
}

/**
 * Standalone function to add to history (for use in non-component contexts)
 */
export async function addToWatchHistoryAsync(item: Omit<WatchHistoryItem, 'watchedAt'>): Promise<boolean> {
    try {
        const stored = await AsyncStorage.getItem(WATCH_HISTORY_KEY);
        let items: WatchHistoryItem[] = stored ? JSON.parse(stored).items || [] : [];

        // Remove if already exists
        items = items.filter(h => !(h.id === item.id && h.type === item.type));

        // Add new item at the beginning
        const newItem: WatchHistoryItem = {
            ...item,
            watchedAt: Date.now(),
        };
        items.unshift(newItem);

        // Keep only most recent items
        items = items.slice(0, MAX_HISTORY_ITEMS);

        await AsyncStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify({ items }));
        return true;
    } catch (e) {
        console.error('Error adding to watch history:', e);
        return false;
    }
}
