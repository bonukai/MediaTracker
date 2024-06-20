import _ from 'lodash';
import { z } from 'zod';

import { MediaItemMetadata } from '../../entity/mediaItemModel.js';
import { getConfiguration } from '../../repository/configurationRepository.js';
import { dumpFetchResponse, tryParseISODate } from '../../utils.js';
import { metadataProviderFactory } from '../metadataProvider.js';
import {
  createTmdbFullImageUrl,
  parseJustWatchResult,
  TMDB_API_KEY,
  tmdbChanges,
  tmdbJustWatchSchema,
} from './tmdb.js';

export const TmdbMovie = metadataProviderFactory({
  name: 'tmdb',
  mediaType: 'movie',
  async search(args) {
    if (!args.query) {
      throw new Error(`query string is not provided`);
    }

    const res = await fetch(
      'https://api.themoviedb.org/3/search/movie?' +
        new URLSearchParams({
          api_key: TMDB_API_KEY,
          query: args.query,
          language: (await getConfiguration()).tmdbLang,
          ...(args.releaseYear
            ? {
                year: args.releaseYear.toString(),
              }
            : {}),
        })
    );

    const data = movieSearchResponseSchema.parse(await res.json());

    return data.results.map((movie) => ({
      ...mapMovie(movie),
      needsDetails: true,
    }));
  },
  async details(args) {
    if (typeof args.tmdbId !== 'number') {
      throw new Error(`unable to retrieve details from TMDB without tmdbId`);
    }

    const configuration = await getConfiguration();

    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${args.tmdbId}?` +
        new URLSearchParams({
          api_key: TMDB_API_KEY,
          append_to_response: 'release_dates,watch/providers',
          language: configuration.tmdbLang,
        })
    );

    if (res.status === 404) {
      throw new Error(`movie with tmdbId ${args.tmdbId} does not exists`);
    }

    if (res.status !== 200) {
      throw new Error(await dumpFetchResponse(res));
    }

    return await movieDetailsToMediaItemMetadata(await res.json());
  },
  async findByImdbId(imdbId: string): Promise<MediaItemMetadata | undefined> {
    const res = await fetch(
      `https://api.themoviedb.org/3/find/${imdbId}?` +
        new URLSearchParams({
          api_key: TMDB_API_KEY,
          external_source: 'imdb_id',
          language: (await getConfiguration()).tmdbLang,
        })
    );

    const data = movieDetailsByExternalIdResponseSchema.parse(await res.json());

    if (data.movie_results.length === 0) {
      return;
    }

    const [movie] = data.movie_results;

    return {
      ...mapMovie(movie),
      imdbId: imdbId,
      needsDetails: true,
    };
  },
  async findByTmdbId(tmdbId: number): Promise<MediaItemMetadata | undefined> {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}?` +
        new URLSearchParams({
          api_key: TMDB_API_KEY,
          append_to_response: 'release_dates,watch/providers',
          language: (await getConfiguration()).tmdbLang,
        })
    );

    if (res.status === 404) {
      return;
    }

    if (res.status !== 200) {
      throw new Error(await dumpFetchResponse(res));
    }

    return await movieDetailsToMediaItemMetadata(await res.json());
  },
  async idsOfItemsToUpdate(args: {
    startDate: Date;
    endDate: Date;
  }): Promise<number[]> {
    return await tmdbChanges({
      ...args,
      category: 'movie',
    });
  },
});

const mapMovie = (movie: {
  title: string;
  id: number;
  original_title?: string | null;
  overview?: string | null;
  release_date?: string | null;
  vote_average?: number | null;
  original_language?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
}): MediaItemMetadata => ({
  mediaType: 'movie',
  source: 'tmdb',
  title: movie.title,
  originalTitle: movie.original_title || null,
  overview: movie.overview || null,
  releaseDate: tryParseISODate(movie.release_date)?.toISOString(),
  tmdbId: movie.id,
  tmdbRating: movie.vote_average || null,
  language: movie.original_language || null,
  externalPosterUrl: movie.poster_path
    ? createTmdbFullImageUrl(movie.poster_path)
    : null,
  externalBackdropUrl: movie.backdrop_path
    ? createTmdbFullImageUrl(movie.backdrop_path)
    : null,
  needsDetails: true,
});

const movieSearchResponseSchema = z.object({
  page: z.number(),
  results: z.array(
    z.object({
      poster_path: z.string().optional().nullable(),
      overview: z.string().optional().nullable(),
      release_date: z.string().optional().nullable(),
      id: z.number(),
      original_title: z.string(),
      original_language: z.string(),
      title: z.string(),
      backdrop_path: z.string().optional().nullable(),
      vote_average: z.number().optional().nullable(),
    })
  ),
  total_results: z.number(),
  total_pages: z.number(),
});

enum ReleaseType {
  Premiere = 1,
  TheatricalLimited = 2,
  Theatrical = 3,
  Digital = 4,
  Physical = 5,
  Tv = 6,
}

const movieDetailsResponseSchema = z.object({
  backdrop_path: z.string().optional().nullable(),
  genres: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
      })
    )
    .optional()
    .nullable(),
  homepage: z.string().optional().nullable(),
  id: z.number(),
  imdb_id: z.string().optional().nullable(),
  original_language: z.string().optional().nullable(),
  original_title: z.string().optional().nullable(),
  overview: z.string().optional().nullable(),
  poster_path: z.string().optional().nullable(),
  release_date: z.string().optional().nullable(),
  runtime: z.number().optional().nullable(),
  spoken_languages: z
    .array(
      z.object({
        iso_639_1: z.string(),
        name: z.string(),
      })
    )
    .optional()
    .nullable(),
  status: z.string().optional().nullable(),
  title: z.string(),
  vote_average: z.number().optional().nullable(),
  release_dates: z
    .object({
      results: z.array(
        z.object({
          iso_3166_1: z.string(),
          release_dates: z.array(
            z.object({
              release_date: z.string(),
              type: z.nativeEnum(ReleaseType),
            })
          ),
        })
      ),
    })
    .optional()
    .nullable(),
  'watch/providers': tmdbJustWatchSchema,
});

const movieDetailsByExternalIdResponseSchema = z.object({
  movie_results: z.array(
    z.object({
      adult: z.boolean().optional().nullable(),
      backdrop_path: z.string().optional().nullable(),
      id: z.number(),
      title: z.string(),
      original_language: z.string().optional().nullable(),
      original_title: z.string().optional().nullable(),
      overview: z.string().optional().nullable(),
      poster_path: z.string().optional().nullable(),
      genre_ids: z.array(z.number()).optional().nullable(),
      release_date: z.string().optional().nullable(),
      vote_average: z.number().optional().nullable(),
    })
  ),
});

const movieDetailsToMediaItemMetadata = async (
  json: object
): Promise<MediaItemMetadata> => {
  const movie = movieDetailsResponseSchema.parse(json);

  const configuration = await getConfiguration();

  const countryCodeByReleaseType = {
    [ReleaseType.Premiere]: null,
    [ReleaseType.TheatricalLimited]: null,
    [ReleaseType.Theatrical]: configuration.theatricalReleaseCountryCode,
    [ReleaseType.Digital]: configuration.digitalReleaseCountryCode,
    [ReleaseType.Physical]: configuration.physicalReleaseCountryCode,
    [ReleaseType.Tv]: configuration.tvReleaseCountryCode,
  };

  const {
    [ReleaseType.Theatrical]: theatricalReleaseDate,
    [ReleaseType.Digital]: digitalReleaseDate,
    [ReleaseType.Physical]: physicalReleaseDate,
    [ReleaseType.Tv]: tvReleaseDate,
  } = _(movie.release_dates?.results)
    .flatMap((item) =>
      item.release_dates.map((subItem) => ({
        ...subItem,
        iso_3166_1: item.iso_3166_1,
      }))
    )
    .groupBy((item) => item.type)
    .mapValues(
      (items) =>
        _.minBy(
          items.filter((item) => {
            const countryCode = countryCodeByReleaseType[item.type];

            if (countryCode && item.iso_3166_1 !== countryCode) {
              return false;
            }

            return true;
          }),
          (item) => item.release_date
        )?.release_date
    )
    .value();

  return {
    ...mapMovie(movie),
    genres: movie.genres?.map((genre) => genre.name) || null,
    imdbId: movie.imdb_id || null,
    runtime: (movie.runtime || 0) * 60 * 1000 || null,
    status: movie.status || null,
    url: movie.homepage || null,
    theatricalReleaseDate: tryParseISODate(theatricalReleaseDate),
    physicalReleaseDate: tryParseISODate(digitalReleaseDate),
    digitalReleaseDate: tryParseISODate(physicalReleaseDate),
    tvReleaseDate: tryParseISODate(tvReleaseDate),
    justWatch: parseJustWatchResult(configuration, movie['watch/providers']),
    needsDetails: false,
  };
};
