import _ from 'lodash';
import { z } from 'zod';

import { ConfigurationJson } from '../../entity/configurationModel.js';
import { MediaItemMetadata } from '../../entity/mediaItemModel.js';
import { logger } from '../../logger.js';
import { getConfiguration } from '../../repository/configurationRepository.js';
import { dumpFetchResponse, sequentialPromise } from '../../utils.js';
import { metadataProviderFactory } from '../metadataProvider.js';
import {
  createTmdbFullImageUrl,
  parseJustWatchResult,
  TMDB_API_KEY,
  tmdbChanges,
  tmdbJustWatchSchema,
} from './tmdb.js';
import { TVmaze } from './TVmaze.js';

export const TmdbTv = metadataProviderFactory({
  name: 'tmdb',
  mediaType: 'tv',
  idName: 'tmdbId',
  async search(args): Promise<MediaItemMetadata[]> {
    if (!args.query) {
      throw new Error(`query string is not provided`);
    }

    const res = await fetch(
      'https://api.themoviedb.org/3/search/tv?' +
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
    const data = tvSearchResponseSchema.parse(await res.json());

    return data.results.map((tvShow) => ({
      ...mapTvShow(tvShow),
      needsDetails: true,
    }));
  },
  async details(args) {
    if (typeof args.tmdbId !== 'number') {
      throw new Error(`unable to retrieve details from TMDB without tmdbId`);
    }

    const configuration = await getConfiguration();

    const fetchTvInfo = async (tmdbId: number): Promise<Response> => {
      return await fetch(
        `https://api.themoviedb.org/3/tv/${tmdbId}?` +
          new URLSearchParams({
            api_key: TMDB_API_KEY,
            append_to_response: 'external_ids,watch/providers',
            language: configuration.tmdbLang,
          })
      );
    };

    const res = await findTvInfoByMultipleIds({
      fetchTvInfo,
      tmdbId: args.tmdbId,
      imdbId: args.imdbId,
      tvdbId: args.tvdbId,
    });

    if (res.status === 404) {
      throw new Error(`tv show with tmdbId ${args.tmdbId} does not exists`);
    }

    if (res.status !== 200) {
      throw new Error(await dumpFetchResponse(res));
    }

    const tvShow = tvDetailsResponseSchema.parse(await res.json());

    const seasons = await getSeasonsDetails({
      tvShow,
      configuration,
    });

    const details: MediaItemMetadata = {
      ...mapTvShow(tvShow),
      genres: tvShow.genres?.map((genre) => genre.name) || null,
      imdbId: tvShow.external_ids?.imdb_id || null,
      tvdbId: tvShow.external_ids?.tvdb_id || null,
      runtime: tvShow.episode_run_time?.at(0) || null,
      seasons: seasons || null,
      status: tvShow.status || null,
      url: tvShow.homepage || null,
      justWatch: parseJustWatchResult(configuration, tvShow['watch/providers']),
      needsDetails: false,
    };

    if (configuration.useTvMazeForEpisodeReleaseDates) {
      return TVmaze.addEpisodeReleaseDates(details);
    }

    return details;
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

    if (res.status === 404) {
      return;
    }

    if (res.status !== 200) {
      throw new Error(await dumpFetchResponse(res));
    }

    const data = findByExternalIdResponse.parse(await res.json());

    if (data.tv_results.length === 0) {
      return;
    }

    const [tvShow] = data.tv_results;

    return {
      ...mapTvShow(tvShow),
      imdbId: imdbId,
      needsDetails: true,
    };
  },
  async findByTvdbId(tvdbId: number): Promise<MediaItemMetadata | undefined> {
    const res = await fetch(
      `https://api.themoviedb.org/3/find/${tvdbId}?` +
        new URLSearchParams({
          api_key: TMDB_API_KEY,
          external_source: 'tvdbId',
          language: (await getConfiguration()).tmdbLang,
        })
    );

    if (res.status === 404) {
      return;
    }

    if (res.status !== 200) {
      throw new Error(await dumpFetchResponse(res));
    }
    const data = findByExternalIdResponse.parse(await res.json());

    if (data.tv_results.length === 0) {
      return;
    }

    const [tvShow] = data.tv_results;

    return {
      ...mapTvShow(tvShow),
      tvdbId: tvdbId,
      needsDetails: true,
    };
  },
  async findByTmdbId(tmdbId: number): Promise<MediaItemMetadata | undefined> {
    const res = await fetch(
      `https://api.themoviedb.org/3/tv/${tmdbId}?` +
        new URLSearchParams({
          api_key: TMDB_API_KEY,
          append_to_response: 'external_ids,watch/providers',
          language: (await getConfiguration()).tmdbLang,
        })
    );

    if (res.status === 404) {
      return;
    }

    if (res.status !== 200) {
      throw new Error(await dumpFetchResponse(res));
    }
    const data = tvDetailsResponseSchema.parse(await res.json());

    return {
      ...mapTvShow(data),
      needsDetails: true,
    };
  },
  async idsOfItemsToUpdate(args: {
    startDate: Date;
    endDate: Date;
  }): Promise<number[]> {
    return await tmdbChanges({
      ...args,
      category: 'tv',
    });
  },
});

const mapTvShow = (tvShow: {
  name: string;
  id: number;
  original_name?: string | null;
  overview?: string | null;
  first_air_date?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  original_language?: string | null;
  vote_average?: number | null;
}): MediaItemMetadata => ({
  mediaType: 'tv',
  source: 'tmdb',
  title: tvShow.name,
  originalTitle: tvShow.original_name || null,
  overview: tvShow.overview || null,
  releaseDate: tvShow.first_air_date || null,
  externalPosterUrl: tvShow.poster_path
    ? createTmdbFullImageUrl(tvShow.poster_path)
    : null,
  externalBackdropUrl: tvShow.backdrop_path
    ? createTmdbFullImageUrl(tvShow.backdrop_path)
    : null,
  tmdbRating: tvShow.vote_average || null,
  language: tvShow.original_language || null,
  tmdbId: tvShow.id,
});

const findTvInfoByMultipleIds = async (args: {
  tmdbId: number;
  imdbId?: string | null;
  tvdbId?: number | null;
  fetchTvInfo: (tmdbId: number) => Promise<Response>;
}) => {
  const { tmdbId, imdbId, tvdbId, fetchTvInfo } = args;
  const res = await fetchTvInfo(tmdbId);

  if (res.status === 404) {
    if (typeof imdbId === 'string') {
      logger.debug(
        `tv show with tmdbId ${tmdbId} does not exists, attempting to find it by imdbId ${imdbId}`
      );

      const imdbSearchRes = await TmdbTv.findByImdbId(imdbId);

      if (typeof imdbSearchRes?.tmdbId === 'number') {
        return await fetchTvInfo(imdbSearchRes.tmdbId);
      }
    }

    if (typeof tvdbId === 'number') {
      logger.debug(
        `tv show with tmdbId ${tmdbId} does not exists, attempting to find it by tvdbId ${tvdbId}`
      );

      const tvdbSearchRes = await TmdbTv.findByTvdbId(tvdbId);

      if (typeof tvdbSearchRes?.tmdbId === 'number') {
        return await fetchTvInfo(tvdbSearchRes.tmdbId);
      }
    }
  }

  return res;
};

const getSeasonsDetails = async (args: {
  tvShow: TvDetailsResponse;
  configuration: ConfigurationJson;
}) => {
  const { tvShow, configuration } = args;
  return await sequentialPromise(tvShow.seasons, async (season) => {
    const res = await fetch(
      `https://api.themoviedb.org/3/tv/${tvShow.id}/season/${season.season_number}?` +
        new URLSearchParams({
          api_key: TMDB_API_KEY,
          append_to_response: 'external_ids',
          language: configuration.tmdbLang,
        })
    );

    if (res.status === 404) {
      throw new Error(
        `season ${season.season_number} for tv show ${tvShow.id} does not exits`
      );
    }

    if (res.status !== 200) {
      throw new Error(await dumpFetchResponse(res));
    }

    const seasonDetails = seasonDetailsResponseSchema.parse(await res.json());

    return {
      seasonNumber: seasonDetails.season_number,
      title: seasonDetails.name,
      tmdbId: seasonDetails.id,
      description: seasonDetails.overview || null,
      externalPosterUrl: seasonDetails.poster_path
        ? createTmdbFullImageUrl(seasonDetails.poster_path)
        : null,
      releaseDate: seasonDetails.air_date || null,
      isSpecialSeason: seasonDetails.season_number === 0,
      episodes: seasonDetails.episodes?.map((episode) => ({
        title: episode.name,
        description: episode.overview || null,
        episodeNumber: episode.episode_number,
        seasonNumber: episode.season_number,
        releaseDate: episode.air_date || null,
        isSpecialEpisode: episode.season_number === 0,
        seasonFinale: episode.episode_type === 'finale',
        midSeasonFinale: episode.episode_type === 'mid_season',
        tmdbId: episode.id,
      })),
    };
  });
};

const tvSearchResponseSchema = z.object({
  page: z.number(),
  results: z.array(
    z.object({
      poster_path: z.string().nullish(),
      id: z.number(),
      backdrop_path: z.string().nullish(),
      vote_average: z.number().nullish(),
      overview: z.string().nullish(),
      first_air_date: z.string().nullish(),
      origin_country: z.array(z.string()).nullish(),
      original_language: z.string().nullish(),
      name: z.string(),
      original_name: z.string(),
    })
  ),
  total_results: z.number(),
  total_pages: z.number(),
});

const tvDetailsResponseSchema = z.object({
  backdrop_path: z.string().nullish(),
  episode_run_time: z.array(z.number()).nullish(),
  first_air_date: z.string().nullish(),
  genres: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
      })
    )
    .optional()
    .nullable(),
  homepage: z.string().nullish(),
  id: z.number(),
  languages: z.array(z.string()).nullish(),
  name: z.string(),
  networks: z
    .array(
      z.object({
        name: z.string(),
        id: z.number(),
        logo_path: z.string().nullish(),
        origin_country: z.string().nullish(),
      })
    )
    .optional()
    .nullable(),
  number_of_seasons: z.number(),
  origin_country: z.array(z.string()).nullish(),
  original_language: z.string().nullish(),
  original_name: z.string().nullish(),
  overview: z.string().nullish(),
  poster_path: z.string().nullish(),
  seasons: z.array(
    z.object({
      air_date: z.string().nullish(),
      episode_count: z.number().nullish(),
      id: z.number(),
      name: z.string().nullish(),
      overview: z.string().nullish(),
      poster_path: z.string().nullish(),
      season_number: z.number(),
    })
  ),
  status: z.string().nullish(),
  type: z.string().nullish(),
  vote_average: z.number().nullish(),
  external_ids: z
    .object({
      imdb_id: z.string().nullish(),
      freebase_mid: z.string().nullish(),
      freebase_id: z.string().nullish(),
      tvdb_id: z.number().nullish(),
      tvrage_id: z.number().nullish(),
      facebook_id: z.string().nullish(),
      instagram_id: z.string().nullish(),
      twitter_id: z.string().nullish(),
    })
    .optional()
    .nullable(),
  'watch/providers': tmdbJustWatchSchema,
});

const seasonDetailsResponseSchema = z.object({
  episodes: z.array(
    z.object({
      air_date: z.string().nullish(),
      episode_number: z.number(),
      id: z.number(),
      name: z.string(),
      overview: z.string().nullish(),
      season_number: z.number(),
      still_path: z.string().nullish(),
      vote_average: z.number().nullish(),
      episode_type: z.enum(['standard', 'finale', 'mid_season']).nullish(),
    })
  ),
  air_date: z.string().nullish(),
  name: z.string(),
  overview: z.string().nullish(),
  id: z.number(),
  poster_path: z.string().nullish(),
  season_number: z.number(),
  external_ids: z
    .object({
      freebase_mid: z.string().nullish(),
      freebase_id: z.string().nullish(),
      tvdb_id: z.number().nullish(),
      tvrage_id: z.number().nullish(),
    })
    .optional()
    .nullable(),
});

const findByExternalIdResponse = z.object({
  tv_results: z.array(
    z.object({
      backdrop_path: z.string().nullish(),
      id: z.number(),
      name: z.string(),
      original_language: z.string().nullish(),
      original_name: z.string().nullish(),
      overview: z.string().nullish(),
      poster_path: z.string().nullish(),
      first_air_date: z.string().nullish(),
      vote_average: z.number().nullish(),
      origin_country: z.array(z.string()).nullish(),
    })
  ),
});

type TvDetailsResponse = z.infer<typeof tvDetailsResponseSchema>;
