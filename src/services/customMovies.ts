import { supabase } from '../lib/supabase';

export interface CustomMovie {
    id: number;
    title: string;
    overview: string | null;
    poster_url: string | null;
    release_date: string | null;
    download_link: string | null;
    watch_link: string | null;
    created_at: string;
    updated_at: string;
    content_type: string | null;
    season_count: number | null;
    episode_count: number | null;
}

export interface CustomEpisode {
    id: string;
    series_id: number;
    season_number: number;
    episode_number: number;
    title: string;
    overview: string | null;
    still_url: string | null;
    stream_url: string | null;
    download_url: string | null;
    created_at: string;
    updated_at: string;
}

export const getCustomMovies = async (): Promise<CustomMovie[]> => {
    try {
        const { data, error } = await supabase
            .from('custom_movies')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching custom movies:', error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('Unexpected error fetching custom movies:', err);
        return [];
    }
};

export const getCustomEpisodes = async (seriesId: number): Promise<CustomEpisode[]> => {
    try {
        const { data, error } = await supabase
            .from('custom_episodes')
            .select('*')
            .eq('series_id', seriesId)
            .order('season_number', { ascending: true })
            .order('episode_number', { ascending: true });

        if (error) {
            console.error('Error fetching custom episodes:', error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('Unexpected error fetching custom episodes:', err);
        return [];
    }
};
