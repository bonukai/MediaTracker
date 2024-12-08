import { z } from 'zod';

import { audibleCountryCodeSchema } from './configurationModel.js';
import { justWatchAvailabilitySchema } from './justWatchModel.js';
import { userRatingModelSchema } from './userRatingModel.js';
import { progressModelSchema } from './progressModel.js';

export const mediaTypeSchema = z.enum([
  'tv',
  'movie',
  'book',
  'video_game',
  'audiobook',
]);

export const itemTypeSchema = z.enum([
  ...mediaTypeSchema.options,
  'episode',
  'season',
]);

export const movieReleaseType = z.enum([
  'theatrical',
  'physical',
  'tv',
  'digital',
]);

export const externalIdsSchema = z.object({
  tmdbId: z.number().nullish(),
  imdbId: z.string().nullish(),
  tvdbId: z.number().nullish(),
  tvmazeId: z.number().nullish(),
  igdbId: z.number().nullish(),
  openlibraryId: z.string().nullish(),
  audibleId: z.string().nullish(),
  traktId: z.number().nullish(),
  goodreadsId: z.number().nullish(),
  ISBN10: z.number().nullish(),
  ISBN13: z.number().nullish(),
});

export const mediaItemModelSchema = z.object({
  id: z.number(),
  numberOfSeasons: z.number().nullish(),
  status: z.string().nullish(),
  title: z.string(),
  originalTitle: z.string().nullish(),
  externalPosterUrl: z.string().nullish(),
  externalBackdropUrl: z.string().nullish(),
  posterId: z.string().nullish(),
  backdropId: z.string().nullish(),
  tmdbRating: z.number().nullish(),
  releaseDate: z.string().nullish(),
  theatricalReleaseDate: z.string().nullish(),
  digitalReleaseDate: z.string().nullish(),
  physicalReleaseDate: z.string().nullish(),
  tvReleaseDate: z.string().nullish(),
  overview: z.string().nullish(),
  lastTimeUpdated: z.number().nullish(),
  source: z.string(),
  network: z.string().nullish(),
  runtime: z.number().nullish(),
  mediaType: mediaTypeSchema,
  genres: z.string().nullish(),
  developer: z.string().nullish(),
  authors: z.string().nullish(),
  narrators: z.string().nullish(),
  platform: z.string().nullish(),
  language: z.string().nullish(),
  numberOfPages: z.number().nullish(),
  audibleCountryCode: audibleCountryCodeSchema.nullish(),
  needsDetails: z.coerce.boolean().nullish(),
  upcomingEpisodeId: z.number().nullish(),
  lastAiredEpisodeId: z.number().nullish(),
  numberOfAiredEpisodes: z.number().nullish(),
  nextAiringDate: z.string().nullish(),
  lastAiringDate: z.string().nullish(),
  ...externalIdsSchema.shape,
});

export const mediaItemMetadataSchema = z.object({
  status: z.string().nullish(),
  title: z.string(),
  originalTitle: z.string().nullish(),
  externalPosterUrl: z.string().nullish(),
  externalBackdropUrl: z.string().nullish(),
  tmdbRating: z.number().nullish(),
  releaseDate: z.string().nullish(),
  theatricalReleaseDate: z.date().nullish(),
  digitalReleaseDate: z.date().nullish(),
  physicalReleaseDate: z.date().nullish(),
  tvReleaseDate: z.date().nullish(),
  overview: z.string().nullish(),
  source: z.string(),
  network: z.string().nullish(),
  runtime: z.number().nullish(),
  mediaType: mediaTypeSchema,
  genres: z.array(z.string()).nullish(),
  developer: z.string().nullish(),
  authors: z.array(z.string()).nullish(),
  narrators: z.array(z.string()).nullish(),
  platform: z.array(z.string()).nullish(),
  language: z.string().nullish(),
  numberOfPages: z.number().nullish(),
  url: z.string().nullish(),
  audibleCountryCode: audibleCountryCodeSchema.nullish(),
  needsDetails: z.coerce.boolean().nullish(),
  ...externalIdsSchema.shape,
  justWatch: z.array(justWatchAvailabilitySchema).nullish(),
  seasons: z
    .array(
      z.object({
        description: z.string().nullish(),
        externalPosterUrl: z.string().nullish(),
        releaseDate: z.string().nullish(),
        title: z.string(),
        seasonNumber: z.number(),
        isSpecialSeason: z.coerce.boolean(),
        tmdbId: z.number().nullish(),
        tvdbId: z.number().nullish(),
        traktId: z.number().nullish(),
        episodes: z
          .array(
            z.object({
              title: z.string(),
              description: z.string().nullish(),
              episodeNumber: z.number(),
              seasonNumber: z.number(),
              releaseDate: z.string().nullish(),
              isSpecialEpisode: z.coerce.boolean(),
              runtime: z.number().nullish(),
              tmdbId: z.number().nullish(),
              imdbId: z.string().nullish(),
              tvdbId: z.number().nullish(),
              traktId: z.number().nullish(),
              seasonFinale: z.coerce.boolean().nullish(),
              midSeasonFinale: z.coerce.boolean().nullish(),
            })
          )
          .nullable()
          .optional(),
      })
    )
    .nullable()
    .optional(),
});

const epSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  episodeNumber: z.number(),
  seasonNumber: z.number(),
  releaseDate: z.string().nullable(),
  seasonId: z.number(),
  tmdbId: z.number().nullable(),
  imdbId: z.string().nullable(),
  runtime: z.number().nullable(),
  isSpecialEpisode: z.coerce.boolean(),
  traktId: z.number().nullable(),
  tvdbId: z.number().nullable(),
  seasonFinale: z.coerce.boolean().nullable(),
  midSeasonFinale: z.coerce.boolean().nullable(),
});

export const episodeResponseSchema = z.object({
  ...epSchema.shape,
  lastSeenAt: z.number().nullish(),
  seen: z.coerce.boolean().nullish(),
  onWatchlist: z.coerce.boolean().nullish(),
  userRating: userRatingModelSchema.nullable().default(null),
});

export const seasonResponseSchema = z.object({
  id: z.number(),
  description: z.string().nullish(),
  poster: z.string().nullish(),
  releaseDate: z.string().nullish(),
  title: z.string(),
  seasonNumber: z.number(),
  isSpecialSeason: z.coerce.boolean(),
  tmdbId: z.number().nullish(),
  tvdbId: z.number().nullish(),
  traktId: z.number().nullish(),
  lastSeenAt: z.number().nullable(),
  seen: z.coerce.boolean().nullable(),
  onWatchlist: z.coerce.boolean().nullable(),
  userRating: userRatingModelSchema.nullable(),
  onLists: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
      })
    )
    .nullish(),
  episodes: z.array(episodeResponseSchema).nullish(),
});

export const mediaItemResponseSchema = z.object({
  id: z.number(),
  status: z.string().nullable(),
  platform: z.array(z.string()).nullable(),
  title: z.string(),
  originalTitle: z.string().nullable(),
  tmdbRating: z.number().nullable(),
  releaseDate: z.string().nullable(),
  theatricalReleaseDate: z.string().nullish(),
  digitalReleaseDate: z.string().nullish(),
  physicalReleaseDate: z.string().nullish(),
  tvReleaseDate: z.string().nullish(),
  overview: z.string().nullable(),
  source: z.string(),
  network: z.string().nullable(),
  runtime: z.number().nullable(),
  mediaType: mediaTypeSchema,
  genres: z.array(z.string()).nullable(),
  developer: z.string().nullable(),
  authors: z.array(z.string()).nullable(),
  narrators: z.array(z.string()).nullable(),
  language: z.string().nullable(),
  numberOfPages: z.coerce.number().nullable(),
  lastTimeUpdated: z.number().nullable(),
  poster: z.string().nullable(),
  backdrop: z.string().nullable(),
  ...externalIdsSchema.shape,
  lastSeenAt: z.number().nullable(),
  seen: z.coerce.boolean().nullable(),
  onWatchlist: z.coerce.boolean().nullable(),
  listedOn: z
    .array(
      z.object({
        listId: z.number(),
        listName: z.string(),
      })
    )
    .nullable(),
  airedEpisodesCount: z.number().nullable(),
  unseenEpisodesCount: z.number().nullable(),
  seenEpisodesCount: z.number().nullable(),
  totalRuntime: z.number().nullable(),
  userRating: z
    .object({
      date: z.number().nullable(),
      rating: z.number().nullable(),
      review: z.string().nullable(),
    })
    .nullable(),
  upcomingEpisode: episodeResponseSchema.nullable(),
  numberOfUpcomingEpisodes: z.number().nullish(),
  lastAiredEpisode: episodeResponseSchema.nullable(),
  numberOfLastAiredEpisodes: z.number().nullish(),
  firstUnwatchedEpisode: episodeResponseSchema.nullable(),
  nextAiring: z.string().nullable(),
  lastAiring: z.string().nullable(),
  seasons: z.array(seasonResponseSchema).nullish(),
  availability: z
    .record(
      z.enum(['flatrate', 'rent', 'buy']),
      z.array(
        z.object({
          providerName: z.string(),
          providerLogo: z.string(),
        })
      )
    )
    .nullish(),
  progress: progressModelSchema.nullable(),
  seenHistory: z
    .array(
      z.object({
        seenId: z.number(),
        seenAt: z.number().nullable(),
        duration: z.number().nullable(),
        episodeId: z.number().nullable(),
        progress: z.number().nullable(),
      })
    )
    .nullable(),
  needsDetails: z.coerce.boolean(),
});

export type MediaItemModel = z.infer<typeof mediaItemModelSchema>;
export type MediaType = z.infer<typeof mediaTypeSchema>;
export type ItemType = z.infer<typeof itemTypeSchema>;
export type ExternalIds = z.infer<typeof externalIdsSchema>;
export type ExternalIdNames = keyof typeof externalIdsSchema.shape;
export type MediaItemMetadata = z.infer<typeof mediaItemMetadataSchema>;
export type MediaItemResponse = z.infer<typeof mediaItemResponseSchema>;
export type SeasonResponse = z.infer<typeof seasonResponseSchema>;
export type EpisodeResponse = z.infer<typeof episodeResponseSchema>;
export type MovieReleaseType = z.infer<typeof movieReleaseType>;

export const externalIdColumnNames = Object.keys(
  externalIdsSchema.shape
) as (keyof typeof externalIdsSchema.shape)[];

export const mediaTypes = mediaTypeSchema.options;
export const itemTypes = itemTypeSchema.options;

export type CalendarItemsResponse = {
  mediaItem: MediaItemResponse;
  episode?: EpisodeResponse;
  releaseDate: string;
  releaseType?: MovieReleaseType;
}[];
