import urljoin from 'url-join';
import path from 'path';
import axios from 'axios';

import { MediaItemForProvider, ExternalIds } from 'src/entity/mediaItem';
import { MetadataProvider } from 'src/metadata/metadataProvider';
import { GlobalConfiguration } from 'src/repository/globalSettings';

const TMDB_API_KEY = '779734046efc1e6127485c54d3b29627';

type PosterSize =
  | 'w92'
  | 'w154'
  | 'w185'
  | 'w342'
  | 'w500'
  | 'w780'
  | 'original';

const getPosterUrl = (p: string, size: PosterSize = 'original') => {
  return urljoin('https://image.tmdb.org/t/p/', size, path.basename(p));
};

abstract class TMDb extends MetadataProvider {
  readonly name = 'tmdb';

  protected mapItem(
    response:
      | Partial<TMDbApi.TvDetailsResponse>
      | Partial<TMDbApi.MovieDetailsResponse>
  ): MediaItemForProvider {
    return {
      source: this.name,
      mediaType: this.mediaType,
      title: null,
      backdrop: response.backdrop_path
        ? getPosterUrl(response.backdrop_path)
        : null,
      poster: response.poster_path ? getPosterUrl(response.poster_path) : null,
      tmdbId: response.id,
      overview: response.overview || null,
      status: response.status || null,
      url: response.homepage || null,
      genres: response.genres?.reduce(
        (generes, genre) => [...generes, genre.name],
        []
      ),
    };
  }
}

export class TMDbMovie extends TMDb {
  readonly mediaType = 'movie';

  async search(query: string): Promise<MediaItemForProvider[]> {
    const res = await axios.get<TMDbApi.MovieSearchResponse>(
      'https://api.themoviedb.org/3/search/movie',
      {
        params: {
          api_key: TMDB_API_KEY,
          query: query,
          language: GlobalConfiguration.configuration.tmdbLang,
        },
      }
    );
    return res.data.results.map((item) => ({
      ...this.mapMovie(item),
      needsDetails: true,
    }));
  }

  async details(mediaItem: ExternalIds): Promise<MediaItemForProvider> {
    const res = await axios.get<TMDbApi.MovieDetailsResponse>(
      `https://api.themoviedb.org/3/movie/${mediaItem.tmdbId}`,
      {
        params: {
          api_key: TMDB_API_KEY,
          language: GlobalConfiguration.configuration.tmdbLang,
        },
      }
    );

    const movie = this.mapMovie(res.data);
    movie.needsDetails = false;

    return movie;
  }

  async findByImdbId(imdbId: string): Promise<MediaItemForProvider> {
    const res = await axios.get(`https://api.themoviedb.org/3/find/${imdbId}`, {
      params: {
        api_key: TMDB_API_KEY,
        external_source: 'imdb_id',
        language: GlobalConfiguration.configuration.tmdbLang,
      },
    });

    if (res.data.movie_results?.length === 0) {
      return;
    }

    return {
      ...this.mapMovie(res.data.movie_results[0]),
      imdbId: imdbId,
      needsDetails: true,
    };
  }

  async findByTmdbId(tmdbId: number): Promise<MediaItemForProvider> {
    return this.details({ tmdbId: tmdbId });
  }

  private mapMovie(item: Partial<TMDbApi.MovieDetailsResponse>) {
    const movie = this.mapItem(item);
    movie.imdbId = item.imdb_id;
    movie.originalTitle = item.original_title;
    movie.releaseDate = item.release_date || null;
    movie.title = item.title;
    movie.runtime = item.runtime;
    movie.tmdbRating = item.vote_average;

    return movie;
  }
}

export class TMDbTv extends TMDb {
  readonly mediaType = 'tv';

  async search(query: string): Promise<MediaItemForProvider[]> {
    const res = await axios.get<TMDbApi.TvSearchResponse>(
      'https://api.themoviedb.org/3/search/tv',
      {
        params: {
          api_key: TMDB_API_KEY,
          query: query,
          language: GlobalConfiguration.configuration.tmdbLang,
        },
      }
    );

    return res.data.results.map((item) => ({
      ...this.mapTvShow(item),
      needsDetails: true,
    }));
  }

  async details(mediaItem: ExternalIds): Promise<MediaItemForProvider> {
    const res = await axios.get<TMDbApi.TvDetailsResponse>(
      `https://api.themoviedb.org/3/tv/${mediaItem.tmdbId}`,
      {
        params: {
          api_key: TMDB_API_KEY,
          append_to_response: 'external_ids',
          language: GlobalConfiguration.configuration.tmdbLang,
        },
      }
    );

    const tvShow = this.mapTvShow(res.data);

    await Promise.all(
      tvShow.seasons?.map(async (season) => {
        const res = await axios.get<TMDbApi.SeasonDetailsResponse>(
          `https://api.themoviedb.org/3/tv/${mediaItem.tmdbId}/season/${season.seasonNumber}`,
          {
            params: {
              api_key: TMDB_API_KEY,
              append_to_response: 'external_ids',
              language: GlobalConfiguration.configuration.tmdbLang,
            },
          }
        );

        season.tvdbId = res.data.external_ids?.tvdb_id;
        season.episodes = res.data.episodes.map((item) =>
          this.mapEpisode(item)
        );
        return season;
      })
    );

    tvShow.needsDetails = false;

    return tvShow;
  }

  async findByImdbId(imdbId: string): Promise<MediaItemForProvider> {
    const res = await axios.get(`https://api.themoviedb.org/3/find/${imdbId}`, {
      params: {
        api_key: TMDB_API_KEY,
        external_source: 'imdb_id',
        language: GlobalConfiguration.configuration.tmdbLang,
      },
    });

    if (res.data.tv_results?.length === 0) {
      return;
    }

    return {
      ...this.mapTvShow(res.data.tv_results[0]),
      imdbId: imdbId,
      needsDetails: true,
    };
  }

  async findByTmdbId(tmdbId: number): Promise<MediaItemForProvider> {
    return this.details({ tmdbId: tmdbId });
  }

  private mapTvShow(item: Partial<TMDbApi.TvDetailsResponse>) {
    const tvShow = this.mapItem(item);
    tvShow.imdbId = item.external_ids?.imdb_id;
    tvShow.tvdbId = item.external_ids?.tvdb_id;
    tvShow.title = item.name;
    tvShow.originalTitle = item.original_name;
    tvShow.releaseDate = item.first_air_date || null;
    tvShow.numberOfSeasons = item.number_of_seasons;
    tvShow.tmdbRating = item.vote_average;
    tvShow.network =
      item.networks?.length > 0 ? item.networks[0].name : undefined;
    tvShow.runtime =
      item.episode_run_time?.length > 0 ? item.episode_run_time[0] : undefined;

    tvShow.seasons = item.seasons?.map((item) => {
      return {
        tmdbId: item.id,
        title: item.name,
        description: item.overview || null,
        poster: item.poster_path ? getPosterUrl(item.poster_path) : null,
        seasonNumber: item.season_number,
        numberOfEpisodes: item.episode_count,
        releaseDate: item.air_date || null,
        isSpecialSeason: item.season_number === 0,
      };
    });

    return tvShow;
  }

  private mapEpisode(item: TMDbApi.Episode) {
    return {
      title: item.name,
      description: item.overview || null,
      episodeNumber: item.episode_number,
      seasonNumber: item.season_number,
      releaseDate: item.air_date || null,
      isSpecialEpisode: item.season_number === 0,
      tmdbId: item.id,
    };
  }
}

namespace TMDbApi {
  export interface SeasonDetailsResponse {
    _id: string;
    air_date: string;
    episodes: Episode[];
    name: string;
    overview: string;
    id: number;
    poster_path: string;
    season_number: number;
    external_ids?: {
      freebase_mid?: string;
      freebase_id?: string;
      tvdb_id?: number;
      tvrage_id?: number;
    };
  }

  export interface Episode {
    air_date: string;
    episode_number: number;
    crew: Crew[];
    guest_stars: GuestStar[];
    id: number;
    name: string;
    overview: string;
    production_code: string;
    season_number: number;
    still_path: string;
    vote_average: number;
    vote_count: number;
  }

  export interface Crew {
    department: string;
    job: string;
    credit_id: string;
    adult: boolean;
    gender: number;
    id: number;
    known_for_department: string;
    name: string;
    original_name: string;
    popularity: number;
    profile_path?: string;
  }

  export interface GuestStar {
    credit_id: string;
    order: number;
    character: string;
    adult: boolean;
    gender: number;
    id: number;
    known_for_department: string;
    name: string;
    original_name: string;
    popularity: number;
    profile_path?: string;
  }

  export interface TvDetailsResponse {
    backdrop_path: string;
    created_by: CreatedBy[];
    episode_run_time: number[];
    first_air_date: string;
    genres: Genre[];
    homepage: string;
    id: number;
    in_production: boolean;
    languages: string[];
    last_air_date: string;
    last_episode_to_air: LastEpisodeToAir;
    name: string;
    next_episode_to_air: unknown;
    networks: Network[];
    number_of_episodes: number;
    number_of_seasons: number;
    origin_country: string[];
    original_language: string;
    original_name: string;
    overview: string;
    popularity: number;
    poster_path: string;
    production_companies: ProductionCompany[];
    production_countries: ProductionCountry[];
    seasons: Season[];
    spoken_languages: SpokenLanguage[];
    status: string;
    tagline: string;
    type: string;
    vote_average: number;
    vote_count: number;
    external_ids?: {
      imdb_id?: string;
      freebase_mid?: string;
      freebase_id?: string;
      tvdb_id?: number;
      tvrage_id?: number;
      facebook_id?: string;
      instagram_id?: string;
      twitter_id?: string;
      id: number;
    };
  }

  export interface CreatedBy {
    id: number;
    credit_id: string;
    name: string;
    gender: number;
    profile_path: string;
  }

  export interface LastEpisodeToAir {
    air_date: string;
    episode_number: number;
    id: number;
    name: string;
    overview: string;
    production_code: string;
    season_number: number;
    still_path: string;
    vote_average: number;
    vote_count: number;
  }

  export interface Network {
    name: string;
    id: number;
    logo_path: string;
    origin_country: string;
  }

  export interface Season {
    air_date: string;
    episode_count: number;
    id: number;
    name: string;
    overview: string;
    poster_path: string;
    season_number: number;
  }

  export interface TvSearchResponse {
    page: number;
    results: {
      poster_path: string;
      popularity: number;
      id: number;
      backdrop_path: string;
      vote_average: number;
      overview: string;
      first_air_date: string;
      origin_country: string[];
      genre_ids: number[];
      original_language: string;
      vote_count: number;
      name: string;
      original_name: string;
    }[];
    total_results: number;
    total_pages: number;
  }

  export interface MovieSearchResponse {
    page: number;
    results: {
      poster_path?: string;
      adult: boolean;
      overview: string;
      release_date: string;
      genre_ids: number[];
      id: number;
      original_title: string;
      original_language: string;
      title: string;
      backdrop_path?: string;
      popularity: number;
      vote_count: number;
      video: boolean;
      vote_average: number;
    }[];
    total_results: number;
    total_pages: number;
  }

  export interface MovieDetailsResponse {
    adult: boolean;
    backdrop_path: string;
    budget: number;
    genres: Genre[];
    homepage: string;
    id: number;
    imdb_id: string;
    original_language: string;
    original_title: string;
    overview: string;
    popularity: number;
    poster_path: string;
    production_companies: ProductionCompany[];
    production_countries: ProductionCountry[];
    release_date: string;
    revenue: number;
    runtime: number;
    spoken_languages: SpokenLanguage[];
    status: string;
    tagline: string;
    title: string;
    video: boolean;
    vote_average: number;
    vote_count: number;
  }

  export interface Genre {
    id: number;
    name: string;
  }

  export interface ProductionCompany {
    id: number;
    logo_path?: string;
    name: string;
    origin_country: string;
  }

  export interface ProductionCountry {
    iso_3166_1: string;
    name: string;
  }

  export interface SpokenLanguage {
    iso_639_1: string;
    name: string;
  }

  export interface ErrorResponse {
    status_code: number;
    status_message: string;
  }

  export interface Configuration {
    images: Images;
    change_keys: string[];
  }

  export interface Images {
    base_url: string;
    secure_base_url: string;
    backdrop_sizes: string[];
    logo_sizes: string[];
    poster_sizes: string[];
    profile_sizes: string[];
    still_sizes: string[];
  }

  export interface FindByExternalIds {
    movie_results: MovieSearchResponse[];
    tv_results: TvSearchResponse[];
  }
}
