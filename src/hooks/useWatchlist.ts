import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const WATCHLIST_KEY = 'showfim_watchlist_guest_v1';

export interface WatchlistItem {
    id: number;
    type: 'movie' | 'tv' | 'custom';
    title: string;
    posterPath: string;
    backdropPath?: string;
    voteAverage?: number;
    addedAt: string;
}

export function useWatchlist() {
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    // Check auth state and load watchlist
    useEffect(() => {
        const checkAuthAndLoad = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUserId(user?.id || null);

            if (user) {
                await loadFromSupabase(user.id);
            } else {
                await loadFromLocal();
            }
        };

        checkAuthAndLoad();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            const newUserId = session?.user?.id || null;
            setUserId(newUserId);

            if (newUserId) {
                // User logged in - migrate local data to Supabase if any
                const localData = await AsyncStorage.getItem(WATCHLIST_KEY);
                if (localData) {
                    const localItems: WatchlistItem[] = JSON.parse(localData);
                    // Merge local items to Supabase
                    for (const item of localItems) {
                        await addToSupabase(newUserId, item);
                    }
                    // Clear local storage after migration
                    await AsyncStorage.removeItem(WATCHLIST_KEY);
                }
                await loadFromSupabase(newUserId);
            } else {
                // User logged out
                await loadFromLocal();
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Load from Supabase
    const loadFromSupabase = async (uid: string) => {
        try {
            setLoading(true);
            const { data, error } = await (supabase as any)
                .from('watchlist')
                .select('*')
                .eq('user_id', uid)
                .order('added_at', { ascending: false });

            if (error) throw error;

            const items: WatchlistItem[] = (data || []).map((row: any) => ({
                id: row.content_id,
                type: row.content_type,
                title: row.title,
                posterPath: row.poster_path,
                backdropPath: row.backdrop_path,
                voteAverage: row.vote_average,
                addedAt: row.added_at,
            }));

            setWatchlist(items);
        } catch (e) {
            console.error('Failed to load watchlist from Supabase:', e);
        } finally {
            setLoading(false);
        }
    };

    // Load from local storage (for guests)
    const loadFromLocal = async () => {
        try {
            setLoading(true);
            const saved = await AsyncStorage.getItem(WATCHLIST_KEY);
            if (saved) {
                setWatchlist(JSON.parse(saved));
            } else {
                setWatchlist([]);
            }
        } catch (e) {
            console.error('Failed to load watchlist from local:', e);
        } finally {
            setLoading(false);
        }
    };

    // Add to Supabase
    const addToSupabase = async (uid: string, item: Omit<WatchlistItem, 'addedAt'>) => {
        try {
            await (supabase as any).from('watchlist').upsert({
                user_id: uid,
                content_id: item.id,
                content_type: item.type,
                title: item.title,
                poster_path: item.posterPath,
                backdrop_path: item.backdropPath,
                vote_average: item.voteAverage,
            }, { onConflict: 'user_id,content_id,content_type' });
        } catch (e) {
            console.error('Failed to add to Supabase watchlist:', e);
        }
    };

    // Add to local storage
    const addToLocal = async (item: WatchlistItem) => {
        const saved = await AsyncStorage.getItem(WATCHLIST_KEY);
        const existing: WatchlistItem[] = saved ? JSON.parse(saved) : [];
        if (!existing.some((i) => i.id === item.id && i.type === item.type)) {
            const updated = [item, ...existing];
            await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
            setWatchlist(updated);
        }
    };

    const addToWatchlist = useCallback(async (item: Omit<WatchlistItem, 'addedAt'>) => {
        const newItem: WatchlistItem = {
            ...item,
            addedAt: new Date().toISOString(),
        };

        if (userId) {
            await addToSupabase(userId, item);
            await loadFromSupabase(userId);
        } else {
            await addToLocal(newItem);
        }
    }, [userId]);

    const removeFromWatchlist = useCallback(async (id: number, type: 'movie' | 'tv') => {
        if (userId) {
            try {
                await (supabase as any)
                    .from('watchlist')
                    .delete()
                    .eq('user_id', userId)
                    .eq('content_id', id)
                    .eq('content_type', type);
                await loadFromSupabase(userId);
            } catch (e) {
                console.error('Failed to remove from Supabase watchlist:', e);
            }
        } else {
            const saved = await AsyncStorage.getItem(WATCHLIST_KEY);
            const existing: WatchlistItem[] = saved ? JSON.parse(saved) : [];
            const updated = existing.filter((i) => !(i.id === id && i.type === type));
            await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
            setWatchlist(updated);
        }
    }, [userId]);

    const isInWatchlist = useCallback((id: number, type: 'movie' | 'tv') => {
        return watchlist.some((i) => i.id === id && i.type === type);
    }, [watchlist]);

    const clearWatchlist = useCallback(async () => {
        if (userId) {
            await (supabase as any).from('watchlist').delete().eq('user_id', userId);
            setWatchlist([]);
        } else {
            await AsyncStorage.removeItem(WATCHLIST_KEY);
            setWatchlist([]);
        }
    }, [userId]);

    return {
        watchlist,
        loading,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
        clearWatchlist,
    };
}
