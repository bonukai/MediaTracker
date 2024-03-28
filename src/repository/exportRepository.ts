import _ from 'lodash';
import { z } from 'zod';

import { Database } from '../database.js';
import { EpisodeModel } from '../entity/episodeModel.js';
import {
  externalIdsSchema,
  itemTypeSchema,
  MediaItemModel,
  MediaType,
} from '../entity/mediaItemModel.js';
import { SeasonModel } from '../entity/seasonModel.js';
import { logger } from '../logger.js';
import { splitWhereInQuery } from '../utils.js';

export const exportRepository = {
  async exportJson(args: { userId: number }) {
    const { watchlist, lists, seenHistory, ratings } = await exportData(args);

    const res: MediaTrackerJsonExportType = {
      meta: {
        formatVersion: 1,
        exportedAt: new Date().toISOString(),
      },
      seenHistory,
      ratings,
      watchlist,
      lists,
    };

    return JSON.stringify(res, null, 2);
  },
} as const;

const exportData = async (args: { userId: number }) => {
  const { userId } = args;

  logger.debug(`creating export for user ${args.userId}`);

  const res = await Database.knex.transaction(async (trx) => {
    const user = await trx('user').where('id', userId).first();
    const seen = await trx('seen').where('userId', userId);
    const userRating = await trx('userRating').where('userId', userId);
    const lists = await trx('list').where('userId', userId);
    const listItems = await trx('listItem').whereIn(
      'listId',
      lists.map((item) => item.id)
    );

    const mediaItems = await splitWhereInQuery(
      _.uniq([
        ...seen.map((item) => item.mediaItemId),
        ...userRating.map((item) => item.mediaItemId),
        ...listItems.map((item) => item.mediaItemId),
      ]),
      (chunk) => trx('mediaItem').whereIn('id', chunk)
    );

    const seasons = await splitWhereInQuery(
      _.uniq([
        ...userRating.map((item) => item.seasonId),
        ...listItems.map((item) => item.seasonId),
      ]).filter(_.isNumber),
      (chunk) => trx('season').whereIn('id', chunk)
    );

    const episodes = await splitWhereInQuery(
      _.uniq([
        ...userRating.map((item) => item.episodeId),
        ...listItems.map((item) => item.episodeId),
        ...seen.map((item) => item.episodeId),
      ]).filter(_.isNumber),
      (chunk) => trx('episode').whereIn('id', chunk)
    );

    logger.debug(`created export for user ${args.userId}`);

    return {
      user,
      seen,
      userRating,
      lists,
      listItems,
      mediaItems,
      seasons,
      episodes,
    };
  });

  const mediaItemMap = createByIdMap(res.mediaItems);
  const seasonsMap = createByIdMap(res.seasons);
  const episodesMap = createByIdMap(res.episodes);

  const seenHistory = res.seen
    .map(mediaItemMap.addMediaItem)
    .map(episodesMap.addEpisode)
    .filter((item) => item.mediaItem)
    .filter((item) =>
      item.mediaItem.mediaType === 'tv' && !item.episode ? false : true
    )
    .map(addItemType)
    .map((item) => ({
      itemType: item.itemType,
      date: item.date ? new Date(item.date).toISOString() : null,
      ...mediaItemBasicInfo(item),
    }));

  const ratings = res.userRating
    .map(mediaItemMap.addMediaItem)
    .map(seasonsMap.addSeason)
    .map(episodesMap.addEpisode)
    .filter((item) => item.mediaItem)
    .map(addItemType)
    .map((item) => ({
      itemType: item.itemType,
      date: item.date ? new Date(item.date).toISOString() : null,
      rating: item.rating,
      review: item.review,
      ...mediaItemBasicInfo(item),
    }));

  const listItems = res.lists.flatMap((list) =>
    res.listItems
      .filter((item) => item.listId === list.id)
      .map(mediaItemMap.addMediaItem)
      .map(seasonsMap.addSeason)
      .map(episodesMap.addEpisode)
      .filter((item) => item.mediaItem)
      .map(addItemType)
      .map((item) => ({
        itemType: item.itemType,
        list: list.name,
        addedAt: new Date(item.addedAt).toISOString(),
        ...mediaItemBasicInfo(item),
      }))
  );

  // console.log(
  //   res.userRating
  //     .map(mediaItemMap.addMediaItem)
  //     .map(seasonsMap.addSeason)
  //     .map(episodesMap.addEpisode)
  //     .filter((item) => item.seasonId)
  // );

  const watchlistId = res.lists.find((item) => item.isWatchlist == true)?.id;

  const lists = res.lists
    .filter((list) => list.id !== watchlistId)
    .map((list) => ({
      name: list.name,
      description: list.description,
      createdAt: new Date(list.createdAt).toISOString(),
      items: res.listItems
        .filter((item) => item.listId === list.id)
        .map(mediaItemMap.addMediaItem)
        .map(seasonsMap.addSeason)
        .map(episodesMap.addEpisode)
        .filter((item) => item.mediaItem)
        .map(addItemType)
        .map((item) => ({
          itemType: item.itemType,
          ...mediaItemBasicInfo(item),
          addedAt: new Date(item.addedAt).toISOString(),
        })),
    }));

  const watchlist = res.listItems
    .filter((item) => item.listId === watchlistId)
    .map(mediaItemMap.addMediaItem)
    .map(seasonsMap.addSeason)
    .map(episodesMap.addEpisode)
    .filter((item) => item.mediaItem)
    .map(addItemType)
    .map((item) => ({
      itemType: item.itemType,
      ...mediaItemBasicInfo(item),
      addedAt: new Date(item.addedAt).toISOString(),
    }));

  return {
    seenHistory,
    ratings,
    lists,
    listItems,
    watchlist,
  };
};

const createByIdMap = <T extends { id: number }>(values: T[]) => {
  const map = _.keyBy(values, (item) => item.id);

  const addMediaItemFactory = <Key extends string>(key: Key) => {
    return <U extends { mediaItemId: number }>(
      item: U
    ): U & { [key in Key]: T | null } => {
      return {
        ...item,
        [key]: map[item.mediaItemId] || null,
      } as U & { [key in Key]: T | null };
    };
  };

  return {
    get: (id: number): T | null => map[id],
    has: (id: number | undefined): boolean =>
      typeof id === 'number' ? id in map : false,
    addMediaItem: <U extends { mediaItemId: number }>(item: U) => {
      return {
        ...item,
        mediaItem: map[item.mediaItemId],
      };
    },
    addSeason: <U extends { seasonId?: number | null }>(item: U) => {
      return {
        ...item,
        season: typeof item.seasonId === 'number' ? map[item.seasonId] : null,
      };
    },
    addEpisode: <U extends { episodeId?: number | null }>(item: U) => {
      return {
        ...item,
        episode:
          typeof item.episodeId === 'number' ? map[item.episodeId] : null,
      };
    },
    addUpcomingEpisode: addMediaItemFactory('upcomingEpisode'),
    addLastAiredEpisodes: addMediaItemFactory('lastAiredEpisodes'),
    addFirstUnwatchedEpisode: addMediaItemFactory('firstUnwatchedEpisode'),
  };
};

const addItemType = <
  T extends {
    mediaItemId: number;
    mediaItem?: MediaItemModel | null;
    seasonId?: number | null;
    episodeId?: number | null;
  },
>(
  value: T
) => {
  if (typeof value.episodeId === 'number') {
    return {
      ...value,
      itemType: 'episode' as 'episode',
    };
  } else if (typeof value.seasonId === 'number') {
    return {
      ...value,
      itemType: 'season' as 'season',
    };
  }

  return {
    ...value,
    itemType: value.mediaItem?.mediaType as MediaType,
  };
};

const mediaItemBasicInfo = <
  T extends {
    mediaItem: MediaItemModel;
    season?: SeasonModel | null;
    episode?: EpisodeModel | null;
  },
>(
  value: T
) => {
  return {
    title: value.mediaItem!.title,
    releaseYear: value.mediaItem!.releaseDate
      ? new Date(value.mediaItem!.releaseDate).getFullYear()
      : null,
    imdbId: value.mediaItem!.imdbId,
    tmdbId: value.mediaItem!.tmdbId,
    tvdbId: value.mediaItem!.tvdbId,
    tvmazeId: value.mediaItem!.tvmazeId,
    igdbId: value.mediaItem!.igdbId,
    openlibraryId: value.mediaItem!.openlibraryId,
    audibleId: value.mediaItem!.audibleId,
    traktId: value.mediaItem!.traktId,
    goodreadsId: value.mediaItem!.goodreadsId,
    ...(value.episode
      ? {
          episode: {
            episodeNumber: value.episode.episodeNumber,
            seasonNumber: value.episode.seasonNumber,
            ids: {
              tmdb: value.episode.tmdbId,
              tvdb: value.episode.tvdbId,
              imdb: value.episode.imdbId,
            },
          },
        }
      : {}),
    ...(value.season
      ? {
          season: {
            seasonNumber: value.season.seasonNumber,
            ids: {
              tmdb: value.season.tmdbId,
              tvdb: value.season.tvdbId,
            },
          },
        }
      : {}),
  };
};

const episodeSchema = z.object({
  episodeNumber: z.number(),
  seasonNumber: z.number(),
  ids: z.object({
    tmdb: z.number().nullish(),
    tvdb: z.number().nullish(),
    imdb: z.string().nullish(),
  }),
});

const seasonSchema = z.object({
  seasonNumber: z.number(),
  ids: z.object({
    tmdb: z.number().nullish(),
    tvdb: z.number().nullish(),
  }),
});

export const mediaTrackerJsonExportSchema = z.object({
  meta: z.object({
    formatVersion: z.literal(1),
    exportedAt: z.string(),
  }),
  seenHistory: z.array(
    z.object({
      itemType: itemTypeSchema.exclude(['season', 'tv']),
      date: z.string().nullish(),
      title: z.string(),
      releaseYear: z.number().nullish(),
      ...externalIdsSchema.shape,
      episode: episodeSchema.optional(),
      season: seasonSchema.optional(),
    })
  ),
  ratings: z.array(
    z.object({
      date: z.string().nullish(),
      rating: z.number().nullish(),
      review: z.string().nullish(),
      title: z.string(),
      releaseYear: z.number().nullish(),
      ...externalIdsSchema.shape,
      episode: episodeSchema.optional(),
      season: seasonSchema.optional(),
      itemType: itemTypeSchema,
    })
  ),
  watchlist: z.array(
    z.object({
      addedAt: z.string().nullish(),
      title: z.string(),
      releaseYear: z.number().nullish(),
      ...externalIdsSchema.shape,
      episode: episodeSchema.optional(),
      season: seasonSchema.optional(),
      itemType: itemTypeSchema,
    })
  ),
  lists: z.array(
    z.object({
      name: z.string(),
      description: z.string().nullish(),
      createdAt: z.string(),
      items: z.array(
        z.object({
          addedAt: z.string().nullish(),
          title: z.string(),
          releaseYear: z.number().nullish(),
          ...externalIdsSchema.shape,
          episode: episodeSchema.optional(),
          season: seasonSchema.optional(),
          itemType: itemTypeSchema,
        })
      ),
    })
  ),
});

type MediaTrackerJsonExportType = z.infer<typeof mediaTrackerJsonExportSchema>;
