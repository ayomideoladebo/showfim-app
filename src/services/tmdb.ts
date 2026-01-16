import {
    TMDBMovie,
    TMDBTVShow,
    TMDBMovieDetails,
    TMDBTVDetails,
    TMDBPersonDetails,
    TMDBCredits,
    TMDBMovieListResponse,
    TMDBTVListResponse,
    TMDBSearchResult,
    TMDBMovieCredit,
    TMDBTVCredit,
    TMDBSeasonDetails,
    TMDBVideosResponse,
    TMDBVideo,
} from '../types/tmdb';

// TMDB API Configuration
const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Image size helpers
export const getImageUrl = (path: string | null, size: 'w200' | 'w300' | 'w400' | 'w500' | 'w780' | 'original' = 'w500'): string => {
    if (!path) return 'https://via.placeholder.com/500x750?text=No+Image';
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

export const getPosterUrl = (path: string | null): string => getImageUrl(path, 'w500');
export const getBackdropUrl = (path: string | null): string => getImageUrl(path, 'w780');
export const getProfileUrl = (path: string | null): string => getImageUrl(path, 'w200');
export const getStillUrl = (path: string | null): string => getImageUrl(path, 'w300');

// Generic fetch function
async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const apiKey = TMDB_API_KEY;

    if (!apiKey) {
        console.error('TMDB_API_KEY is not set. Check your .env file.');
        throw new Error('TMDB API key is missing. Please add EXPO_PUBLIC_TMDB_API_KEY to your .env file');
    }

    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    url.searchParams.append('api_key', apiKey);

    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });

    console.log('Fetching from TMDB:', endpoint);

    try {
        const response = await fetch(url.toString());

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`TMDB API Error ${response.status}:`, errorText);
            throw new Error(`TMDB API Error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        if (error instanceof TypeError && error.message === 'Network request failed') {
            console.error('Network request failed. Check internet connection.');
            throw new Error('Network error: Please check your internet connection');
        }
        throw error;
    }
}

// ============================================================
// MOVIES
// ============================================================

export async function getTrendingMovies(timeWindow: 'day' | 'week' = 'week'): Promise<TMDBMovie[]> {
    const response = await tmdbFetch<TMDBMovieListResponse>(`/trending/movie/${timeWindow}`);
    return response.results;
}

export async function getUpcomingInTheaters(page: number = 1): Promise<TMDBMovie[]> {
    // Get movies releasing in theaters in the next 7-30 days
    const minDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const response = await tmdbFetch<TMDBMovieListResponse>('/discover/movie', {
        language: 'en-US',
        sort_by: 'primary_release_date.asc',
        with_release_type: '3|4', // 3 = theatrical, 4 = theatrical limited
        include_adult: 'false',
        include_video: 'false',
        region: 'US',
        'primary_release_date.gte': minDate,
        'primary_release_date.lte': maxDate,
        page: page.toString(),
    });
    return response.results;
}

export async function getPopularMovies(page: number = 1): Promise<TMDBMovie[]> {
    const response = await tmdbFetch<TMDBMovieListResponse>('/movie/popular', { page: page.toString() });
    return response.results;
}

export async function getActionMovies(excludeIds: number[] = []): Promise<TMDBMovie[]> {
    // Get action movies (genre 28) from the last 3 years
    const today = new Date().toISOString().split('T')[0];
    const threeYearsAgo = new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const randomPage = Math.floor(Math.random() * 5) + 1;

    const response = await tmdbFetch<TMDBMovieListResponse>('/discover/movie', {
        with_genres: '28',
        sort_by: 'popularity.desc',
        'release_date.gte': threeYearsAgo,
        'release_date.lte': today,
        page: randomPage.toString(),
    });

    // Filter out excluded IDs
    const filtered = response.results.filter(movie => !excludeIds.includes(movie.id));
    return filtered;
}

export async function getComedyMovies(excludeIds: number[] = []): Promise<TMDBMovie[]> {
    // Get comedy movies (genre 35) from the last 3 years
    const today = new Date().toISOString().split('T')[0];
    const threeYearsAgo = new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const randomPage = Math.floor(Math.random() * 5) + 1;

    const response = await tmdbFetch<TMDBMovieListResponse>('/discover/movie', {
        with_genres: '35',
        sort_by: 'popularity.desc',
        'release_date.gte': threeYearsAgo,
        'release_date.lte': today,
        page: randomPage.toString(),
    });

    const filtered = response.results.filter(movie => !excludeIds.includes(movie.id));
    return filtered;
}

export async function getDramaMovies(excludeIds: number[] = []): Promise<TMDBMovie[]> {
    // Get drama movies (genre 18) from the last 3 years
    const today = new Date().toISOString().split('T')[0];
    const threeYearsAgo = new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const randomPage = Math.floor(Math.random() * 5) + 1;

    const response = await tmdbFetch<TMDBMovieListResponse>('/discover/movie', {
        with_genres: '18',
        sort_by: 'popularity.desc',
        'release_date.gte': threeYearsAgo,
        'release_date.lte': today,
        page: randomPage.toString(),
    });

    const filtered = response.results.filter(movie => !excludeIds.includes(movie.id));
    return filtered;
}

// Combined Movie + TV functions by genre
export async function getActionContent(excludeIds: number[] = []): Promise<(TMDBMovie | TMDBTVShow)[]> {
    const today = new Date().toISOString().split('T')[0];
    const threeYearsAgo = new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const randomPage = Math.floor(Math.random() * 3) + 1;

    const [movies, tvShows] = await Promise.all([
        tmdbFetch<TMDBMovieListResponse>('/discover/movie', {
            with_genres: '28',
            sort_by: 'popularity.desc',
            'release_date.gte': threeYearsAgo,
            'release_date.lte': today,
            page: randomPage.toString(),
        }),
        tmdbFetch<TMDBTVListResponse>('/discover/tv', {
            with_genres: '10759', // Action & Adventure for TV
            sort_by: 'popularity.desc',
            'first_air_date.gte': threeYearsAgo,
            'first_air_date.lte': today,
            page: randomPage.toString(),
        }),
    ]);

    const filteredMovies = movies.results.filter(m => !excludeIds.includes(m.id)).slice(0, 6);
    const filteredTv = tvShows.results.filter(t => !excludeIds.includes(t.id)).slice(0, 4);
    const combined = [...filteredMovies, ...filteredTv].sort(() => Math.random() - 0.5);
    return combined;
}

export async function getComedyContent(excludeIds: number[] = []): Promise<(TMDBMovie | TMDBTVShow)[]> {
    const today = new Date().toISOString().split('T')[0];
    const threeYearsAgo = new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const randomPage = Math.floor(Math.random() * 3) + 1;

    const [movies, tvShows] = await Promise.all([
        tmdbFetch<TMDBMovieListResponse>('/discover/movie', {
            with_genres: '35',
            sort_by: 'popularity.desc',
            'release_date.gte': threeYearsAgo,
            'release_date.lte': today,
            page: randomPage.toString(),
        }),
        tmdbFetch<TMDBTVListResponse>('/discover/tv', {
            with_genres: '35',
            sort_by: 'popularity.desc',
            'first_air_date.gte': threeYearsAgo,
            'first_air_date.lte': today,
            page: randomPage.toString(),
        }),
    ]);

    const filteredMovies = movies.results.filter(m => !excludeIds.includes(m.id)).slice(0, 6);
    const filteredTv = tvShows.results.filter(t => !excludeIds.includes(t.id)).slice(0, 4);
    const combined = [...filteredMovies, ...filteredTv].sort(() => Math.random() - 0.5);
    return combined;
}

export async function getDramaContent(excludeIds: number[] = []): Promise<(TMDBMovie | TMDBTVShow)[]> {
    const today = new Date().toISOString().split('T')[0];
    const threeYearsAgo = new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const randomPage = Math.floor(Math.random() * 3) + 1;

    const [movies, tvShows] = await Promise.all([
        tmdbFetch<TMDBMovieListResponse>('/discover/movie', {
            with_genres: '18',
            sort_by: 'popularity.desc',
            'release_date.gte': threeYearsAgo,
            'release_date.lte': today,
            page: randomPage.toString(),
        }),
        tmdbFetch<TMDBTVListResponse>('/discover/tv', {
            with_genres: '18',
            sort_by: 'popularity.desc',
            'first_air_date.gte': threeYearsAgo,
            'first_air_date.lte': today,
            page: randomPage.toString(),
        }),
    ]);

    const filteredMovies = movies.results.filter(m => !excludeIds.includes(m.id)).slice(0, 6);
    const filteredTv = tvShows.results.filter(t => !excludeIds.includes(t.id)).slice(0, 4);
    const combined = [...filteredMovies, ...filteredTv].sort(() => Math.random() - 0.5);
    return combined;
}

export async function getTopRatedMovies(page: number = 1): Promise<TMDBMovie[]> {
    const response = await tmdbFetch<TMDBMovieListResponse>('/movie/top_rated', { page: page.toString() });
    return response.results;
}

export async function getNowPlayingMovies(page: number = 1): Promise<TMDBMovie[]> {
    const response = await tmdbFetch<TMDBMovieListResponse>('/movie/now_playing', { page: page.toString() });
    return response.results;
}

export async function getUpcomingMovies(page: number = 1): Promise<TMDBMovie[]> {
    const response = await tmdbFetch<TMDBMovieListResponse>('/movie/upcoming', { page: page.toString() });
    return response.results;
}

export async function getMovieDetails(movieId: number): Promise<TMDBMovieDetails> {
    return tmdbFetch<TMDBMovieDetails>(`/movie/${movieId}`);
}

export async function getMovieCredits(movieId: number): Promise<TMDBCredits> {
    return tmdbFetch<TMDBCredits>(`/movie/${movieId}/credits`);
}

export async function getSimilarMovies(movieId: number): Promise<TMDBMovie[]> {
    const response = await tmdbFetch<TMDBMovieListResponse>(`/movie/${movieId}/similar`);
    return response.results;
}

export async function getRecommendedMovies(movieId: number): Promise<TMDBMovie[]> {
    const response = await tmdbFetch<TMDBMovieListResponse>(`/movie/${movieId}/recommendations`);
    return response.results;
}

export async function getMovieVideos(movieId: number): Promise<TMDBVideo[]> {
    const response = await tmdbFetch<TMDBVideosResponse>(`/movie/${movieId}/videos`);
    return response.results;
}

export function getMovieTrailer(videos: TMDBVideo[]): TMDBVideo | null {
    // Priority: Official YouTube Trailer > Any YouTube Trailer > Any Trailer > First Video
    const youtubeVideos = videos.filter(v => v.site === 'YouTube');

    // First try to find official trailer
    const officialTrailer = youtubeVideos.find(v => v.type === 'Trailer' && v.official);
    if (officialTrailer) return officialTrailer;

    // Then any trailer
    const anyTrailer = youtubeVideos.find(v => v.type === 'Trailer');
    if (anyTrailer) return anyTrailer;

    // Then any teaser
    const teaser = youtubeVideos.find(v => v.type === 'Teaser');
    if (teaser) return teaser;

    // Then any YouTube video
    if (youtubeVideos.length > 0) return youtubeVideos[0];

    // Fall back to any video
    return videos.length > 0 ? videos[0] : null;
}

export function getYouTubeUrl(videoKey: string): string {
    return `https://www.youtube.com/watch?v=${videoKey}`;
}

// ============================================================
// TV SHOWS
// ============================================================

export async function getTrendingTV(timeWindow: 'day' | 'week' = 'week'): Promise<TMDBTVShow[]> {
    const response = await tmdbFetch<TMDBTVListResponse>(`/trending/tv/${timeWindow}`);
    return response.results;
}

export async function getPopularTV(page: number = 1): Promise<TMDBTVShow[]> {
    const response = await tmdbFetch<TMDBTVListResponse>('/tv/popular', { page: page.toString() });
    return response.results;
}

export async function getTopRatedTV(page: number = 1): Promise<TMDBTVShow[]> {
    const response = await tmdbFetch<TMDBTVListResponse>('/tv/top_rated', { page: page.toString() });
    return response.results;
}

export async function getAiringTodayTV(page: number = 1): Promise<TMDBTVShow[]> {
    const response = await tmdbFetch<TMDBTVListResponse>('/tv/airing_today', { page: page.toString() });
    return response.results;
}

export async function getTVDetails(tvId: number): Promise<TMDBTVDetails> {
    return tmdbFetch<TMDBTVDetails>(`/tv/${tvId}`);
}

export async function getTVCredits(tvId: number): Promise<TMDBCredits> {
    return tmdbFetch<TMDBCredits>(`/tv/${tvId}/credits`);
}

export async function getSimilarTV(tvId: number): Promise<TMDBTVShow[]> {
    const response = await tmdbFetch<TMDBTVListResponse>(`/tv/${tvId}/similar`);
    return response.results;
}

export async function getTVSeasonDetails(tvId: number, seasonNumber: number): Promise<TMDBSeasonDetails> {
    return tmdbFetch<TMDBSeasonDetails>(`/tv/${tvId}/season/${seasonNumber}`);
}

export async function getKDramas(excludeIds: number[] = []): Promise<TMDBTVShow[]> {
    const page = Math.floor(Math.random() * 5) + 1;
    const response = await tmdbFetch<TMDBTVListResponse>('/discover/tv', {
        with_original_language: 'ko',
        with_origin_country: 'KR',
        sort_by: 'popularity.desc',
        page: page.toString(),
    });
    return response.results.filter(show => !excludeIds.includes(show.id));
}

// ============================================================
// PEOPLE / ACTORS
// ============================================================

export async function getPersonDetails(personId: number): Promise<TMDBPersonDetails> {
    return tmdbFetch<TMDBPersonDetails>(`/person/${personId}`);
}

export async function getPersonMovieCredits(personId: number): Promise<{ cast: TMDBMovieCredit[]; crew: TMDBMovieCredit[] }> {
    return tmdbFetch(`/person/${personId}/movie_credits`);
}

export async function getPersonTVCredits(personId: number): Promise<{ cast: TMDBTVCredit[]; crew: TMDBTVCredit[] }> {
    return tmdbFetch(`/person/${personId}/tv_credits`);
}

// ============================================================
// SEARCH
// ============================================================

export async function searchMulti(query: string, page: number = 1): Promise<TMDBSearchResult> {
    return tmdbFetch<TMDBSearchResult>('/search/multi', {
        query,
        page: page.toString()
    });
}

export async function searchMovies(query: string, page: number = 1): Promise<TMDBMovieListResponse> {
    return tmdbFetch<TMDBMovieListResponse>('/search/movie', {
        query,
        page: page.toString()
    });
}

export async function searchTV(query: string, page: number = 1): Promise<TMDBTVListResponse> {
    return tmdbFetch<TMDBTVListResponse>('/search/tv', {
        query,
        page: page.toString()
    });
}

export async function searchPeople(query: string, page: number = 1): Promise<any> {
    return tmdbFetch('/search/person', {
        query,
        page: page.toString()
    });
}

// ============================================================
// DISCOVER (Advanced filtering)
// ============================================================

export async function discoverMovies(params: {
    sortBy?: string;
    withGenres?: string;
    year?: number;
    page?: number;
} = {}): Promise<TMDBMovie[]> {
    const queryParams: Record<string, string> = {
        page: (params.page || 1).toString(),
    };

    if (params.sortBy) queryParams.sort_by = params.sortBy;
    if (params.withGenres) queryParams.with_genres = params.withGenres;
    if (params.year) queryParams.year = params.year.toString();

    const response = await tmdbFetch<TMDBMovieListResponse>('/discover/movie', queryParams);
    return response.results;
}

export async function discoverTV(params: {
    sortBy?: string;
    withGenres?: string;
    firstAirDateYear?: number;
    page?: number;
} = {}): Promise<TMDBTVShow[]> {
    const queryParams: Record<string, string> = {
        page: (params.page || 1).toString(),
    };

    if (params.sortBy) queryParams.sort_by = params.sortBy;
    if (params.withGenres) queryParams.with_genres = params.withGenres;
    if (params.firstAirDateYear) queryParams.first_air_date_year = params.firstAirDateYear.toString();

    const response = await tmdbFetch<TMDBTVListResponse>('/discover/tv', queryParams);
    return response.results;
}

// ============================================================
// PLATFORM-SPECIFIC CONTENT (Latest On Netflix, Prime, etc.)
// ============================================================

export async function discoverMoviesByPlatform(
    platformId: number,
    page: number = 1
): Promise<TMDBMovie[]> {
    const today = new Date().toISOString().split('T')[0];
    const minDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 1 year ago

    const response = await tmdbFetch<TMDBMovieListResponse>('/discover/movie', {
        with_watch_providers: platformId.toString(),
        watch_region: 'US',
        sort_by: 'release_date.desc',
        'release_date.lte': today,
        'release_date.gte': minDate,
        page: page.toString(),
    });
    return response.results;
}

export async function discoverTVByPlatform(
    platformId: number,
    page: number = 1
): Promise<TMDBTVShow[]> {
    const today = new Date().toISOString().split('T')[0];
    const minDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 1 year ago

    const response = await tmdbFetch<TMDBTVListResponse>('/discover/tv', {
        with_watch_providers: platformId.toString(),
        watch_region: 'US',
        sort_by: 'first_air_date.desc',
        'first_air_date.lte': today,
        'first_air_date.gte': minDate,
        page: page.toString(),
    });
    return response.results;
}

export async function getLatestOnPlatform(
    platformId: number
): Promise<(TMDBMovie | TMDBTVShow)[]> {
    const [movies, tvShows] = await Promise.all([
        discoverMoviesByPlatform(platformId),
        discoverTVByPlatform(platformId),
    ]);

    // Combine and sort by date (most recent first)
    const combined = [...movies, ...tvShows];
    return combined.slice(0, 10); // Return top 10
}
