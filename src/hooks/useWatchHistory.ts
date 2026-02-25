import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';

interface WatchHistoryConfig {
    contentId: number;
    mediaType: 'movie' | 'tv';
    durationSeconds: number; // The total duration of the media
}

const UPDATE_INTERVAL_MS = 60000; // 1 minute
const COMPLETION_THRESHOLD = 0.90; // 90% watched marks as completed

export function useWatchHistory({ contentId, mediaType, durationSeconds }: WatchHistoryConfig) {
    const { user } = useAuth();
    const lastUpdateTimeMs = useRef(Date.now());
    const minutesTrackedInSession = useRef(0);
    const isCompletedLogged = useRef(false);

    // Sync to database
    const syncProgress = useCallback(async (currentPositionSeconds: number, forceForce = false) => {
        if (!user) return;

        const now = Date.now();
        const timeSinceLastUpdate = now - lastUpdateTimeMs.current;

        // Only update if requested forced OR 1 min has passed
        if (!forceForce && timeSinceLastUpdate < UPDATE_INTERVAL_MS) {
            return;
        }

        try {
            lastUpdateTimeMs.current = now;
            const watchPercentage = durationSeconds > 0 ? currentPositionSeconds / durationSeconds : 0;
            const isCompleted = watchPercentage >= COMPLETION_THRESHOLD;

            // We only want to log completion once per session to avoid duplicate updates, 
            // but we always want to update the minutes watched.
            const shouldLogCompletion = isCompleted && !isCompletedLogged.current;
            if (isCompleted) isCompletedLogged.current = true;

            // Start transaction-like behavior using RPC or direct upsert
            // Fetch current row first to know what to add
            const { data: existingData } = await (supabase
                .from('watch_history') as any)
                .select('minutes_watched, is_completed')
                .eq('user_id', user.id)
                .eq('content_id', contentId)
                .eq('media_type', mediaType)
                .single();

            // We add 1 minute to the total if this was triggered by the interval
            const newMinutes = ((existingData as any)?.minutes_watched || 0) + 1;
            const newlyCompleted = shouldLogCompletion && !((existingData as any)?.is_completed);

            // Upsert watch history
            await (supabase.from('watch_history' as any) as any).upsert({
                user_id: user.id,
                content_id: contentId,
                media_type: mediaType,
                minutes_watched: newMinutes,
                is_completed: (existingData as any)?.is_completed || isCompleted,
                last_watched_at: new Date().toISOString()
            }, { onConflict: 'user_id,content_id,media_type' });

            // If we crossed the 1 minute milestone (and are not jumping), grant 1 XP.
            // Easiest is to always grant 1 XP per minute watched.
            // E.g get current XP, increment by 1
            const { data: profileObj } = await (supabase
                .from('profiles') as any)
                .select('xp, movies_watched')
                .eq('id', user.id)
                .single();

            let newXp = (profileObj?.xp || 0) + 1;
            let newMoviesCount = profileObj?.movies_watched || 0;

            if (newlyCompleted) {
                newMoviesCount += 1;
            }

            await (supabase.from('profiles') as any).update({
                xp: newXp,
                movies_watched: newMoviesCount
            } as any).eq('id', user.id);

        } catch (error) {
            console.error("Failed to sync watch history", error);
        }
    }, [user, contentId, mediaType, durationSeconds]);

    return { syncProgress };
}
