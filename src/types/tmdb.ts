// TMDB API Type Definitions

export interface TMDBMovie {
    id: number;
    title: string;
    original_title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    vote_average: number;
    vote_count: number;
    popularity: number;
    genre_ids: number[];
    adult: boolean;
    video: boolean;
    original_language: string;
}

export interface TMDBTVShow {
    id: number;
    name: string;
    original_name: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    first_air_date: string;
    vote_average: number;
    vote_count: number;
    popularity: number;
    genre_ids: number[];
    origin_country: string[];
    original_language: string;
}

export interface TMDBMovieDetails extends TMDBMovie {
    runtime: number;
    genres: TMDBGenre[];
    production_companies: TMDBProductionCompany[];
    production_countries: TMDBProductionCountry[];
    spoken_languages: TMDBSpokenLanguage[];
    status: string;
    tagline: string;
    budget: number;
    revenue: number;
    imdb_id: string;
}

export interface TMDBTVDetails extends TMDBTVShow {
    created_by: TMDBCreator[];
    episode_run_time: number[];
    genres: TMDBGenre[];
    homepage: string;
    in_production: boolean;
    languages: string[];
    last_air_date: string;
    last_episode_to_air: TMDBEpisode | null;
    next_episode_to_air: TMDBEpisode | null;
    networks: TMDBNetwork[];
    number_of_episodes: number;
    number_of_seasons: number;
    production_companies: TMDBProductionCompany[];
    seasons: TMDBSeason[];
    status: string;
    tagline: string;
    type: string;
}

export interface TMDBPerson {
    id: number;
    name: string;
    known_for_department: string;
    profile_path: string | null;
    adult: boolean;
    gender: number;
    popularity: number;
}

export interface TMDBPersonDetails extends TMDBPerson {
    also_known_as: string[];
    biography: string;
    birthday: string | null;
    deathday: string | null;
    homepage: string | null;
    imdb_id: string;
    place_of_birth: string | null;
}

export interface TMDBCastMember {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
    cast_id: number;
    credit_id: string;
    gender: number;
    known_for_department: string;
}

export interface TMDBCrewMember {
    id: number;
    name: string;
    job: string;
    department: string;
    profile_path: string | null;
    credit_id: string;
    gender: number;
    known_for_department: string;
}

export interface TMDBCredits {
    id: number;
    cast: TMDBCastMember[];
    crew: TMDBCrewMember[];
}

export interface TMDBGenre {
    id: number;
    name: string;
}

export interface TMDBProductionCompany {
    id: number;
    logo_path: string | null;
    name: string;
    origin_country: string;
}

export interface TMDBProductionCountry {
    iso_3166_1: string;
    name: string;
}

export interface TMDBSpokenLanguage {
    english_name: string;
    iso_639_1: string;
    name: string;
}

export interface TMDBCreator {
    id: number;
    credit_id: string;
    name: string;
    gender: number;
    profile_path: string | null;
}

export interface TMDBEpisode {
    id: number;
    name: string;
    overview: string;
    vote_average: number;
    vote_count: number;
    air_date: string;
    episode_number: number;
    production_code: string;
    runtime: number;
    season_number: number;
    show_id: number;
    still_path: string | null;
}

export interface TMDBSeason {
    air_date: string;
    episode_count: number;
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    season_number: number;
}

export interface TMDBNetwork {
    id: number;
    logo_path: string | null;
    name: string;
    origin_country: string;
}

export interface TMDBSeasonDetails {
    _id: string;
    air_date: string;
    episodes: TMDBEpisode[];
    name: string;
    overview: string;
    id: number;
    poster_path: string | null;
    season_number: number;
}

export interface TMDBVideo {
    id: string;
    iso_639_1: string;
    iso_3166_1: string;
    key: string;
    name: string;
    site: string;
    size: number;
    type: string;
    official: boolean;
    published_at: string;
}

export interface TMDBVideosResponse {
    id: number;
    results: TMDBVideo[];
}

export interface TMDBMovieCredit {
    id: number;
    title: string;
    character?: string;
    job?: string;
    poster_path: string | null;
    release_date: string;
    vote_average: number;
    popularity?: number;
    credit_id?: string;
}

export interface TMDBTVCredit {
    id: number;
    name: string;
    character?: string;
    job?: string;
    poster_path: string | null;
    first_air_date: string;
    vote_average: number;
    popularity?: number;
    credit_id?: string;
}

export interface TMDBSearchResult {
    page: number;
    results: (TMDBMovie | TMDBTVShow | TMDBPerson)[];
    total_pages: number;
    total_results: number;
}

export interface TMDBMovieListResponse {
    page: number;
    results: TMDBMovie[];
    total_pages: number;
    total_results: number;
}

export interface TMDBTVListResponse {
    page: number;
    results: TMDBTVShow[];
    total_pages: number;
    total_results: number;
}

// Helper type for combined movie/TV content
export type TMDBMediaItem = TMDBMovie | TMDBTVShow;

// Type guard functions
export function isTMDBMovie(item: TMDBMediaItem): item is TMDBMovie {
    return 'title' in item;
}

export function isTMDBTVShow(item: TMDBMediaItem): item is TMDBTVShow {
    return 'name' in item;
}

export function isTMDBPerson(item: any): item is TMDBPerson {
    return 'known_for_department' in item;
}
