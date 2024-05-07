import { Knex } from 'knex';
import _ from 'lodash';

import { TRPCError } from '@trpc/server';

import { parseISO, startOfYear } from 'date-fns';
import { Database } from '../database.js';
import {
  EpisodeModel,
  episodeModelSchema,
  TvEpisodeFilters,
} from '../entity/episodeModel.js';
import {
  JustWatchAvailabilityModel,
  JustWatchProviderModel,
} from '../entity/justWatchModel.js';
import {
  CalendarItemsResponse,
  EpisodeResponse,
  episodeResponseSchema,
  externalIdColumnNames,
  ExternalIds,
  externalIdsSchema,
  MediaItemMetadata,
  MediaItemModel,
  mediaItemModelSchema,
  MediaItemResponse,
  mediaItemResponseSchema,
  MediaType,
  SeasonResponse,
} from '../entity/mediaItemModel.js';
import { SeasonModel, seasonModelSchema } from '../entity/seasonModel.js';
import { UserRatingModel } from '../entity/userRatingModel.js';
import { updateMetadata } from '../updateMetadata.js';
import {
  getImageId,
  h,
  is,
  splitWhereInQuery,
  toReleaseDateFormat,
  withDefinedPropertyFactory,
} from '../utils.js';
import { logger } from '../logger.js';

export const mediaItemRepository = {
  async findByExternalId(args: {
    mediaType: MediaType;
    ids: ExternalIds;
  }): Promise<MediaItemModel | undefined> {
    const { mediaType, ids } = args;

    if (Object.values(ids).filter(is).length === 0) {
      return;
    }

    const res = await Database.knex('mediaItem')
      .where((qb) => {
        Object.entries(ids)
          .filter(([_, value]) => is(value))
          .forEach(([key, value]) => {
            qb.orWhere(key, value);
          });
      })
      .where('mediaType', mediaType)
      .first();

    if (res) {
      return mediaItemModelSchema.parse(res);
    }
  },
  async findByTitleAndReleaseYear(args: {
    mediaType: MediaType;
    title: string;
    releaseYear: number;
  }): Promise<MediaItemModel | undefined> {
    const { mediaType, title, releaseYear } = args;

    const res = await Database.knex('mediaItem')
      .where('title', title)
      .where('mediaType', mediaType)
      .whereBetween('releaseDate', [
        new Date(args.releaseYear, 0, 1).toISOString(),
        new Date(args.releaseYear, 11, 31).toISOString(),
      ])
      .first();

    if (res) {
      return mediaItemModelSchema.parse(res);
    }
  },
  async findEpisode(args: {
    mediaItemId: number;
    seasonNumber: number;
    episodeNumber: number;
  }): Promise<EpisodeModel | undefined> {
    const { mediaItemId, seasonNumber, episodeNumber } = args;

    const episode = await Database.knex('episode')
      .where('tvShowId', mediaItemId)
      .where('seasonNumber', seasonNumber)
      .where('episodeNumber', episodeNumber)
      .first();

    if (episode) {
      return episodeModelSchema.parse(episode);
    }
  },
  async create(mediaItem: MediaItemMetadata) {
    const res = await Database.knex('mediaItem')
      .insert(
        mediaItemModelSchema.parse({
          ...mediaItem,
          genres: mediaItem.genres?.join(',') || null,
          narrators: mediaItem.narrators?.join(',') || null,
          authors: mediaItem.authors?.join(',') || null,
          platform: mediaItem.platform
            ? JSON.stringify(mediaItem.platform)
            : null,
          lastTimeUpdated: Date.now(),
          posterId: mediaItem.externalPosterUrl ? getImageId() : null,
          backdropId: mediaItem.externalBackdropUrl ? getImageId() : null,
        })
      )
      .returning('*');

    return mediaItem;
  },
  async findOrCreate(mediaItem: MediaItemMetadata): Promise<MediaItemModel> {
    return await Database.knex.transaction(async (trx) => {
      const existingItem = await trx('mediaItem')
        .where('mediaType', mediaItem.mediaType)
        .andWhere((qb) => {
          externalIdColumnNames.forEach((columnName) => {
            const id = mediaItem[columnName];

            if (id !== null && id !== undefined) {
              qb.orWhere(columnName, id);
            }
          });
        })
        .first();

      if (existingItem) {
        return mediaItemModelSchema.parse(existingItem);
      }

      const [insertedMediaItem] = await trx('mediaItem')
        .insert(
          mediaItemModelSchema.partial().parse({
            ...mediaItem,
            theatricalReleaseDate:
              mediaItem.theatricalReleaseDate?.toISOString(),
            digitalReleaseDate: mediaItem.digitalReleaseDate?.toISOString(),
            physicalReleaseDate: mediaItem.physicalReleaseDate?.toISOString(),
            tvReleaseDate: mediaItem.tvReleaseDate?.toISOString(),
            genres: mediaItem.genres?.join(',') || null,
            narrators: mediaItem.narrators?.join(',') || null,
            authors: mediaItem.authors?.join(',') || null,
            platform: mediaItem.platform
              ? JSON.stringify(mediaItem.platform)
              : null,
            lastTimeUpdated: Date.now(),
            posterId: mediaItem.externalPosterUrl ? getImageId() : null,
            backdropId: mediaItem.externalBackdropUrl ? getImageId() : null,
          })
        )
        .returning('*');

      if (mediaItem.seasons) {
        await Promise.all(
          mediaItem.seasons.map(async (season) => {
            const [insertedSeason] = await trx('season')
              .insert(
                seasonModelSchema.partial().parse({
                  ...season,
                  numberOfEpisodes: season?.episodes?.length || 0,
                  posterId: season.externalPosterUrl ? getImageId() : null,
                  tvShowId: insertedMediaItem.id,
                })
              )
              .returning('*');

            if (season.episodes) {
              await Promise.all(
                season.episodes.map((episode) =>
                  trx('episode').insert(
                    episodeModelSchema.partial().parse({
                      ...episode,
                      tvShowId: insertedMediaItem.id,
                      seasonId: insertedSeason.id,
                      seasonAndEpisodeNumber:
                        insertedSeason.seasonNumber * 1000 +
                        episode.episodeNumber,
                    })
                  )
                )
              );
            }
          })
        );
      }

      return mediaItemModelSchema.parse(insertedMediaItem);
    });
  },
  async addManyMediaItems(args: {
    mediaItems: MediaItemMetadata[];
    mediaType: MediaType;
  }): Promise<MediaItemModel[]> {
    const { mediaItems: searchResult, mediaType } = args;
    return await Promise.all(
      searchResult
        .filter(itemWithAtLeastOneExternalId)
        .map(async (item) => {
          return await Database.knex.transaction(async (trx) => {
            const existingItem = await trx('mediaItem')
              .where('mediaType', mediaType)
              .andWhere((qb) => {
                externalIdColumnNames.map((columnName) => {
                  if (item[columnName]) {
                    qb.orWhere(columnName, item[columnName]);
                  }
                });
              })
              .first();

            if (existingItem) {
              return existingItem;
            }

            const [insertedItem] = await trx('mediaItem')
              .insert(
                mediaItemModelSchema.partial().parse({
                  ...item,
                  genres: item.genres?.join(','),
                  narrators: item.narrators?.join(','),
                  authors: item.authors?.join(','),
                  platform: item.platform
                    ? JSON.stringify(item.platform)
                    : null,
                  posterId: item.externalPosterUrl ? getImageId() : null,
                  backdropId: item.externalBackdropUrl ? getImageId() : null,
                  lastTimeUpdated: Date.now(),
                })
              )
              .returning('*');

            return insertedItem;
          });
        })
        .map(async (item) => mediaItemModelSchema.parse(await item))
    );
  },
  async details(args: {
    userId: number;
    mediaItemId: number;
  }): Promise<MediaItemResponse> {
    const { mediaItemId, userId } = args;

    const res = await Database.knex.transaction(async (trx) => {
      const mediaItem = await trx('mediaItem').where('id', mediaItemId).first();

      if (!mediaItem) {
        throw new Error(`No mediaItem with id ${mediaItemId}`);
      }

      const seasons = await trx('season')
        .where('tvShowId', mediaItemId)
        .orderBy('seasonNumber', 'asc');

      const episodes = await trx('episode')
        .where('tvShowId', mediaItemId)
        .orderBy('seasonAndEpisodeNumber', 'asc');

      const seen = await trx('seen')
        .where('mediaItemId', mediaItemId)
        .where('userId', userId);

      const progress = await trx('progress')
        .where('mediaItemId', mediaItemId)
        .where('userId', userId)
        .first();

      const userRating = await trx('userRating')
        .where('mediaItemId', mediaItemId)
        .where('userId', userId);

      const lists = await trx('list')
        .select('list.*')
        .innerJoin('listItem', (qb) =>
          qb
            .onVal('mediaItemId', mediaItemId)
            .on('list.id', 'listItem.listId')
            .onNull('listItem.seasonId')
            .onNull('listItem.episodeId')
        )
        .where('userId', userId);

      const justWatchAvailability = await trx('justWatchAvailability').where(
        'mediaItemId',
        mediaItem.id
      );

      const justWatchProviders = await trx('justWatchProvider').whereIn(
        'id',
        justWatchAvailability.map((item) => item.providerId)
      );

      return {
        mediaItem,
        seasons,
        episodes,
        seen,
        progress,
        userRating,
        lists,
        justWatchAvailability,
        justWatchProviders,
      };
    });

    const mediaItemUserRating =
      res.userRating
        .filter((item) => item.episodeId === null && item.seasonId === null)
        .at(0) || null;

    const episodeUserRatingMap = _(res.userRating)
      .filter(withDefinedPropertyFactory('episodeId'))
      .keyBy((episode) => episode.episodeId)
      .value();

    const seenByEpisodeId = _(res.seen)
      .filter(withDefinedPropertyFactory('episodeId'))
      .keyBy((item) => item.episodeId)
      .value();

    const episodesWithSeen = _(res.episodes)
      .map((episode) => ({
        ...episode,
        lastSeenAt: seenByEpisodeId[episode.id]?.date || null,
        seen: seenByEpisodeId[episode.id],
        userRating: episodeUserRatingMap[episode.id] || null,
      }))
      .sortBy((episode) => episode.seasonAndEpisodeNumber)
      .value();

    const upcomingEpisode =
      episodesWithSeen
        .filter(TvEpisodeFilters.nonSpecialEpisodes)
        .find(TvEpisodeFilters.unreleasedEpisodes) || null;

    const lastAiredEpisode =
      _(episodesWithSeen)
        .filter(TvEpisodeFilters.nonSpecialEpisodes)
        .findLast(TvEpisodeFilters.releasedEpisodes) || null;

    const firstUnwatchedEpisode =
      episodesWithSeen
        .filter(TvEpisodeFilters.nonSpecialEpisodes)
        .filter((episode) => !episode.seen)
        .find(TvEpisodeFilters.releasedEpisodes) || null;

    const seasons = res.seasons
      .map((season) => ({
        ...season,
        poster: season.posterId
          ? `/api/v1/img/get?id=${season.posterId}`
          : null,
        episodes: episodesWithSeen.filter(
          (episode) => episode.seasonId === season.id
        ),
      }))
      .map((season) => ({
        ...season,
        seen:
          season.episodes
            .filter(TvEpisodeFilters.releasedEpisodes)
            .find((episode) => !episode.seen) === undefined,
        lastSeenAt:
          _.minBy(season.episodes, (item) => item.lastSeenAt)?.lastSeenAt ||
          null,
        userRating: null,
      }));

    const totalRuntime =
      res.mediaItem.mediaType === 'tv'
        ? _(res.episodes)
            .map((item) =>
              item.runtime ? item.runtime : res.mediaItem.runtime || 0
            )
            .sum()
        : res.mediaItem.runtime;

    const lastSeenAt =
      _(res.seen)
        .filter((item) => typeof item.date === 'number')
        .sortBy((item) => item.date)
        .last()?.date || null;

    const airedEpisodesCount = res.mediaItem.needsDetails
      ? null
      : res.episodes
          .filter(TvEpisodeFilters.nonSpecialEpisodes)
          .filter(TvEpisodeFilters.releasedEpisodes).length;

    const seenEpisodesCount = res.mediaItem.needsDetails
      ? null
      : episodesWithSeen
          .filter(TvEpisodeFilters.nonSpecialEpisodes)
          .filter(TvEpisodeFilters.releasedEpisodes)
          .filter((item) => item.seen).length;

    const unseenEpisodesCount =
      typeof airedEpisodesCount === 'number' &&
      typeof seenEpisodesCount === 'number'
        ? airedEpisodesCount - seenEpisodesCount
        : null;

    const seen =
      res.mediaItem.mediaType === 'tv' && typeof airedEpisodesCount === 'number'
        ? airedEpisodesCount > 0 && unseenEpisodesCount === 0
        : res.seen.length > 0;

    const nextAiring =
      (res.mediaItem.mediaType === 'tv'
        ? upcomingEpisode?.releaseDate
        : res.mediaItem.releaseDate) || null;

    const lastAiring =
      (res.mediaItem.mediaType === 'tv'
        ? lastAiredEpisode?.releaseDate
        : res.mediaItem.releaseDate) || null;

    const onWatchlist =
      res.lists.find((list) => list.isWatchlist) !== undefined;

    const listedOn = res.lists.map((item) => ({
      listId: item.id,
      listName: item.name,
    }));

    const justWatchProviderById = _.keyBy(
      res.justWatchProviders,
      (item) => item.id
    );

    const availability = _(res.justWatchAvailability)
      .sortBy((item) => item.displayPriority)
      .groupBy((item) => item.type)
      .mapValues((values) =>
        values.map((value) => ({
          providerName: justWatchProviderById[value.providerId].name,
          providerLogo: `/api/v1/img/get?id=${
            justWatchProviderById[value.providerId].logo
          }`,
        }))
      )
      .value();

    const progress = res.progress || null;

    const seenHistory = res.seen.map((item) => ({
      seenId: item.id,
      seenAt: item.date,
      duration: item.duration,
      episodeId: item.episodeId,
      progress: null,
    }));

    return mediaItemResponseSchema.parse({
      ...mediaItemModelToMediaItemResponse(res.mediaItem),
      seasons,
      upcomingEpisode,
      lastAiredEpisode,
      firstUnwatchedEpisode,
      userRating: mediaItemUserRating,
      seen,
      totalRuntime,
      lastSeenAt,
      airedEpisodesCount,
      unseenEpisodesCount,
      seenEpisodesCount,
      nextAiring,
      lastAiring,
      availability,
      onWatchlist,
      listedOn,
      progress,
      seenHistory,
    });
  },
  async userDetails(args: {
    trx?: Knex.Transaction;
    mediaItemIds: number[];
    episodeIds?: number[];
    seasonIds?: number[];
    userId: number;
  }) {
    const { trx } = args;

    if (trx) {
      return _getMediaItemsWithUserProperties({
        ...args,
        trx: trx,
      });
    }

    return Database.knex.transaction(async (trx) =>
      _getMediaItemsWithUserProperties({
        ...args,
        trx: trx,
      })
    );
  },

  async updateMetadataIfNeeded(args: { mediaItemId: number }) {
    const { mediaItemId } = args;

    const mediaItem = await Database.knex('mediaItem')
      .where('id', mediaItemId)
      .first();

    if (!mediaItem) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `no mediaItem with id ${mediaItemId}`,
      });
    }

    if (mediaItem.needsDetails) {
      await updateMetadata(mediaItem);
    }
  },
  async getCalendarItems(args: {
    userId: number;
    from: string;
    to: string;
    listId?: number | null;
    mediaTypes?: MediaType[] | null;
  }) {
    const { from, to, listId, mediaTypes, userId } = args;

    const {
      episodes,
      mediaItems,
      mediaItemReleases,
      digitalReleases,
      physicalReleases,
      theatricalReleases,
      tvReleases,
    } = await Database.knex.transaction(async (trx) => {
      const list = listId
        ? await trx('list').where('id', listId).first()
        : await trx('list')
            .where('userId', userId)
            .where('isWatchlist', true)
            .first();

      if (!listId) {
        if (!list) {
          throw new Error(`No list with id ${listId}`);
        }

        if (list.userId !== userId) {
          // TODO: Check if list was shared
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `List ${listId} does not belong to user ${userId}`,
          });
        }
      }

      if (!list) {
        throw new Error(`No watchlist for user ${userId}`);
      }

      const listItems = await trx('listItem')
        .where('listId', list.id)
        .select('mediaItemId', 'seasonId', 'episodeId');

      const episodes = await splitWhereInQuery(
        _.uniq(
          listItems
            .filter((item) => item.episodeId === null && item.seasonId === null)
            .map((item) => item.mediaItemId)
        ),
        (chunk) =>
          trx('episode')
            .whereIn('tvShowId', chunk)
            .where('isSpecialEpisode', false)
            .whereBetween('releaseDate', [from, to])
      );

      const mediaItems = await splitWhereInQuery(
        _.uniq(episodes.map((item) => item.tvShowId)),
        (chunk) => trx('mediaItem').whereIn('id', chunk)
      );

      const mediaItemIds = _.uniq(
        listItems
          .filter((item) => item.episodeId === null && item.seasonId === null)
          .map((item) => item.mediaItemId)
      );

      const mediaItemReleases = await splitWhereInQuery(mediaItemIds, (chunk) =>
        trx('mediaItem')
          .whereNot('mediaType', 'tv')
          .whereNot('mediaType', 'movie')
          .whereIn('id', chunk)
          .whereBetween('releaseDate', [from, to])
      );

      const [
        digitalReleases,
        physicalReleases,
        theatricalReleases,
        tvReleases,
      ] = await Promise.all(
        (
          [
            'digitalReleaseDate',
            'physicalReleaseDate',
            'theatricalReleaseDate',
            'tvReleaseDate',
          ] as const
        ).map((releaseType) =>
          splitWhereInQuery(mediaItemIds, (chunk) =>
            trx('mediaItem')
              .where('mediaType', 'movie')
              .whereIn('id', chunk)
              .whereBetween(releaseType, [from, to])
          )
        )
      );

      return {
        episodes,
        mediaItems,
        mediaItemReleases,
        digitalReleases,
        physicalReleases,
        theatricalReleases,
        tvReleases,
      };
    });

    const mediaItemById = _.keyBy(mediaItems, (item) => item.id);

    const res: CalendarItemsResponse = _([
      ...episodes.map((episode) => ({
        mediaItem: mediaItemResponseSchema.parse(
          mediaItemModelToMediaItemResponse(mediaItemById[episode.tvShowId])
        ),
        episode: episodeResponseSchema.parse(episode),
        releaseDate: parseISO(episode.releaseDate!).toISOString(),
      })),
      ...mediaItemReleases.map((mediaItem) => ({
        mediaItem: mediaItemResponseSchema.parse(
          mediaItemModelToMediaItemResponse(mediaItem)
        ),
        releaseDate: parseISO(mediaItem.releaseDate!).toISOString(),
      })),
      ...digitalReleases.map((mediaItem) => ({
        mediaItem: mediaItemResponseSchema.parse(
          mediaItemModelToMediaItemResponse(mediaItem)
        ),
        releaseDate: parseISO(mediaItem.digitalReleaseDate!).toISOString(),
        releaseType: 'digital',
      })),
      ...theatricalReleases.map((mediaItem) => ({
        mediaItem: mediaItemResponseSchema.parse(
          mediaItemModelToMediaItemResponse(mediaItem)
        ),
        releaseDate: parseISO(mediaItem.theatricalReleaseDate!).toISOString(),
        releaseType: 'theatrical',
      })),
      ...physicalReleases.map((mediaItem) => ({
        mediaItem: mediaItemResponseSchema.parse(
          mediaItemModelToMediaItemResponse(mediaItem)
        ),
        releaseDate: parseISO(mediaItem.physicalReleaseDate!).toISOString(),
        releaseType: 'physical',
      })),
      ...tvReleases.map((mediaItem) => ({
        mediaItem: mediaItemResponseSchema.parse(
          mediaItemModelToMediaItemResponse(mediaItem)
        ),
        releaseDate: parseISO(mediaItem.tvReleaseDate!).toISOString(),
        releaseType: 'tv',
      })),
    ])
      .sortBy((item) => item.releaseDate)
      .filter((item) =>
        mediaTypes ? mediaTypes.includes(item.mediaItem.mediaType) : true
      )
      .value();

    return res;
  },
  async unrated(args: {
    userId: number;
    page: number;
    numberOfItemsPerPage: number;
  }) {
    const { userId, page, numberOfItemsPerPage } = args;

    const res = await Database.knex.transaction(async (trx) => {
      const query = trx('mediaItem')
        .select('mediaItem.*')
        .innerJoin(
          (qb) =>
            qb
              .max({ date: 'date' })
              .select('mediaItemId')
              .from('seen')
              .as('seen')
              .where('userId', userId)
              .groupBy('mediaItemId'),
          (qb) => qb.on('seen.mediaItemId', 'mediaItem.id')
        )
        .leftJoin('userRating', (qb) =>
          qb
            .on('userRating.mediaItemId', 'mediaItem.id')
            .onVal('userRating.userId', userId)
            .onNull('userRating.seasonId')
            .onNull('userRating.episodeId')
        )
        .whereNull('userRating.rating');

      const countRes = await query.clone().count({ count: '*' });
      const items: MediaItemModel[] = await query
        .clone()
        .orderBy('seen.date', 'desc')
        .offset(numberOfItemsPerPage * (page - 1))
        .limit(numberOfItemsPerPage);

      const count = Number(countRes.at(0)?.count || 0);

      const details = await mediaItemRepository.userDetails({
        trx,
        userId,
        mediaItemIds: items.map((item) => item.id),
      });

      return { items, details, count };
    });

    const items = res.items
      .map((item) => res.details.getMediaItemById(item.id))
      .filter(is);

    const totalNumberOfItems = res.count;
    const totalNumberOfPages = Math.ceil(
      totalNumberOfItems / numberOfItemsPerPage
    );

    return {
      items,
      page: 1,
      totalNumberOfItems,
      totalNumberOfPages,
    };
  },
  async updateLastAndUpcomingEpisodeAirings(args?: {
    mediaItemIds?: number[];
    trx?: Knex.Transaction;
  }) {
    logger.debug(
      h`updating last and upcoming episode airings for ${
        args?.mediaItemIds ? args.mediaItemIds.length : 'all'
      } tv shows`
    );

    const knex = args?.trx ? args.trx : Database.knex;
    const currentDateString = toReleaseDateFormat(new Date());

    // Upcoming episode
    await knex('mediaItem')
      .modify((qb) => {
        if (args?.mediaItemIds) {
          qb.whereIn('id', args.mediaItemIds);
        }
      })
      .update(
        'upcomingEpisodeId',
        knex
          .from('episode')
          .select('upcomingEpisode.id')
          .where('episode.tvShowId', Database.knex.ref('mediaItem.id'))
          .leftJoin(
            (qb) =>
              qb
                .from('episode')
                .select('tvShowId')
                .min({
                  seasonAndEpisodeNumber: 'seasonAndEpisodeNumber',
                })
                .where('isSpecialEpisode', false)
                .where('releaseDate', '>', currentDateString)
                .groupBy('tvShowId')
                .as('abc'),
            'abc.tvShowId',
            'mediaItem.id'
          )
          .leftJoin(Database.knex.ref('episode').as('upcomingEpisode'), (qb) =>
            qb
              .on('abc.tvShowId', 'upcomingEpisode.tvShowId')
              .on(
                'abc.seasonAndEpisodeNumber',
                'upcomingEpisode.seasonAndEpisodeNumber'
              )
          )
      );

    // console.log(a);

    // Last aired episode
    await knex('mediaItem')
      .modify((qb) => {
        if (args?.mediaItemIds) {
          qb.whereIn('id', args.mediaItemIds);
        }
      })
      .update(
        'lastAiredEpisodeId',
        knex
          .from('episode')
          .select('lastAiredEpisode.id')
          .where('episode.tvShowId', knex.ref('mediaItem.id'))
          .leftJoin(
            (qb) =>
              qb
                .from('episode')
                .select('tvShowId')
                .max({
                  seasonAndEpisodeNumber: 'seasonAndEpisodeNumber',
                })
                .where('isSpecialEpisode', false)
                .where('releaseDate', '<=', currentDateString)
                .groupBy('tvShowId')
                .as('abc'),
            'abc.tvShowId',
            'mediaItem.id'
          )
          .leftJoin(knex.ref('episode').as('lastAiredEpisode'), (qb) =>
            qb
              .on('abc.tvShowId', 'lastAiredEpisode.tvShowId')
              .on(
                'abc.seasonAndEpisodeNumber',
                'lastAiredEpisode.seasonAndEpisodeNumber'
              )
          )
      );

    // Number of aired episodes
    await knex('mediaItem')
      .modify((qb) => {
        if (args?.mediaItemIds) {
          qb.whereIn('id', args.mediaItemIds);
        }
      })
      .update(
        'numberOfAiredEpisodes',
        knex
          .from('episode')
          .count('*')
          .where('releaseDate', '<=', currentDateString)
          .where('isSpecialEpisode', false)
          .whereNotNull('releaseDate')
          .where('episode.tvShowId', knex.ref('mediaItem.id'))
      );
  },
} as const;

export const itemWithAtLeastOneExternalId = (item: Partial<ExternalIds>) => {
  return (
    externalIdColumnNames.filter((columnName) => item[columnName]).length > 0
  );
};

export const mediaItemModelToMediaItemResponse = (
  mediaItem: MediaItemModel
) => {
  return {
    lastSeenAt: null,
    airedEpisodesCount: null,
    unseenEpisodesCount: null,
    seenEpisodesCount: null,
    totalRuntime: null,
    lastAiring: null,
    nextAiring: null,
    firstUnwatchedEpisode: null,
    lastAiredEpisode: null,
    upcomingEpisode: null,
    userRating: null,
    listedOn: null,
    progress: null,
    seenHistory: null,
    ...mediaItem,
    authors: mediaItem.authors?.split(',') || null,
    narrators: mediaItem.narrators?.split(',') || null,
    genres: mediaItem.genres?.split(',') || null,
    platform: mediaItem.platform ? JSON.parse(mediaItem.platform) : null,
    backdrop: mediaItem.backdropId
      ? `/api/v1/img/get?id=${mediaItem.backdropId}`
      : null,
    poster: mediaItem.posterId
      ? `/api/v1/img/get?id=${mediaItem.posterId}`
      : null,
  };
};

const _getMediaItemsWithUserProperties = async (args: {
  trx: Knex.Transaction;
  mediaItemIds: number[];
  episodeIds?: number[];
  seasonIds?: number[];
  userId: number;
}) => {
  const { trx, mediaItemIds, userId, episodeIds, seasonIds } = args;

  const currentDateString = toReleaseDateFormat(new Date());

  const uniqMediaItemIds = _.uniq(mediaItemIds);
  const uniqEpisodeIds = _.uniq(episodeIds || []);
  const uniqSeasonIds = _.uniq(seasonIds || []);

  const watchlist = await trx('list')
    .where('userId', userId)
    .where('isWatchlist', true)
    .first();

  if (!watchlist) {
    throw new Error(`No watchlist for user ${userId}`);
  }

  const mediaItemsOnWatchlist = await splitWhereInQuery(
    uniqMediaItemIds,
    (chunk) =>
      trx('listItem')
        .select('mediaItemId')
        .whereNull('episodeId')
        .whereNull('seasonId')
        .where('listId', watchlist.id)
        .whereIn('mediaItemId', chunk)
  );

  const episodesOnWatchlist = await splitWhereInQuery(uniqEpisodeIds, (chunk) =>
    trx('listItem')
      .select('episodeId')
      .whereNull('seasonId')
      .where('listId', watchlist.id)
      .whereIn('episodeId', chunk)
  );

  const seasonsOnWatchlist = await splitWhereInQuery(uniqSeasonIds, (chunk) =>
    trx('listItem')
      .select('seasonId')
      .whereNull('episodeId')
      .where('listId', watchlist.id)
      .whereIn('seasonId', chunk)
  );

  const mediaItems = await splitWhereInQuery(uniqMediaItemIds, (chunk) =>
    trx('mediaItem').whereIn('id', chunk)
  );

  const firstUnwatchedEpisodesAndUnseenEpisodesCount: {
    mediaItemId: number;
    firstUnwatchedEpisodeId: number | null;
    unseenEpisodesCount: number | null;
  }[] = await splitWhereInQuery(uniqMediaItemIds, (chunk) =>
    trx
      .select({
        mediaItemId: 'firstUnwatchedEpisode.tvShowId',
        firstUnwatchedEpisodeId: 'firstUnwatchedEpisode.id',
        unseenEpisodesCount: 'unseenEpisodesCount',
      })
      .from((qb: Knex.QueryBuilder) =>
        qb
          .from('episode')
          .whereIn('tvShowId', chunk)
          .where('isSpecialEpisode', false)
          .leftJoin(
            (qb) => qb.from('seen').where('userId', userId).as('seen'),
            'seen.episodeId',
            'episode.id'
          )
          .whereNull('seen.id')
          .whereNot('episode.releaseDate', '')
          .whereNot('episode.releaseDate', null)
          .where('episode.releaseDate', '<=', currentDateString)
          .select('tvShowId')
          .count('*', { as: 'unseenEpisodesCount' })
          .min('seasonAndEpisodeNumber', {
            as: 'seasonAndEpisodeNumber',
          })
          .groupBy('tvShowId')
          .as('firstUnwatchedEpisodeHelper')
      )
      .leftJoin(
        Database.knex.ref('episode').as('firstUnwatchedEpisode'),
        (qb) =>
          qb
            .on(
              'firstUnwatchedEpisode.tvShowId',
              'firstUnwatchedEpisodeHelper.tvShowId'
            )
            .andOn(
              'firstUnwatchedEpisode.seasonAndEpisodeNumber',
              'firstUnwatchedEpisodeHelper.seasonAndEpisodeNumber'
            )
      )
  );

  // const mediaItemTotalRuntime = await splitWhereInQuery(
  //   uniqMediaItemIds,
  //   (chunk) =>
  //     trx('mediaItem')
  //       .select('tvShowId', 'totalRuntime')
  //       .whereIn('id', chunk)
  //       .leftJoin(
  //         (qb) =>
  //           qb
  //             .select('tvShowId')
  //             .leftJoin('mediaItem', 'mediaItem.id', 'tvShowId')
  //             .sum({
  //               totalRuntime: 'episode.runtime',
  //             })
  //             .from('episode')
  //             .groupBy('tvShowId')
  //             .where('episode.releaseDate', '<', currentDateString)
  //             .where('episode.isSpecialEpisode', false)
  //             .as('mediaItemTotalRuntime'),
  //         'mediaItemTotalRuntime.tvShowId',
  //         'mediaItem.id'
  //       )
  // );

  const mediaItemRatings = await splitWhereInQuery(uniqMediaItemIds, (chunk) =>
    trx('userRating')
      .where('userId', userId)
      .whereIn('mediaItemId', chunk)
      .whereNull('episodeId')
      .whereNull('seasonId')
  );

  const lastSeenMediaItem = await splitWhereInQuery(uniqMediaItemIds, (chunk) =>
    trx('seen')
      .select('date', 'mediaItemId')
      .where('userId', userId)
      .whereIn('mediaItemId', chunk)
      .max({ date: 'date' })
      .groupBy('mediaItemId')
  );

  const episodes = await splitWhereInQuery(
    _([
      ...(episodeIds || []),
      ...mediaItems.map((item) => item.upcomingEpisodeId),
      ...mediaItems.map((item) => item.lastAiredEpisodeId),
      ...firstUnwatchedEpisodesAndUnseenEpisodesCount.map(
        (item) => item.firstUnwatchedEpisodeId
      ),
    ])
      .filter(Boolean)
      .uniq()
      .value() as number[],
    (chunk) => trx('episode').whereIn('id', chunk)
  );

  const episodeRatings = await splitWhereInQuery(
    episodes.map((episode) => episode.id),
    (chunk) => trx('userRating').whereIn('episodeId', chunk)
  );

  const seasons = await splitWhereInQuery(uniqSeasonIds, (chunk) =>
    trx('season').whereIn('id', chunk)
  );

  const seasonRatings = await splitWhereInQuery(
    seasons.map((episode) => episode.id),
    (chunk) => trx('userRating').whereIn('seasonId', chunk)
  );

  const justWatchAvailability = await splitWhereInQuery(
    uniqMediaItemIds,
    (chunk) => trx('justWatchAvailability').whereIn('mediaItemId', chunk)
  );

  const justWatchProviders = await splitWhereInQuery(
    justWatchAvailability.map((item) => item.providerId),
    (chunk) => trx('justWatchProvider').whereIn('id', chunk)
  );

  return combineMediaItemsWithUserData({
    justWatchProviders,
    justWatchAvailability,
    mediaItemRatings,
    episodeRatings,
    seasonRatings,
    episodes,
    seasons,
    lastSeenMediaItem,
    firstUnwatchedEpisodesAndUnseenEpisodesCount,
    mediaItems,
    mediaItemsOnWatchlist,
    episodesOnWatchlist,
    seasonsOnWatchlist,
  });
};

const combineMediaItemsWithUserData = (args: {
  mediaItems: MediaItemModel[];
  episodes: EpisodeModel[];
  seasons: SeasonModel[];
  mediaItemRatings: UserRatingModel[];
  seasonRatings: UserRatingModel[];
  episodeRatings: UserRatingModel[];
  justWatchAvailability: JustWatchAvailabilityModel[];
  justWatchProviders: JustWatchProviderModel[];
  lastSeenMediaItem: { mediaItemId: number | null; date?: number | null }[];
  mediaItemsOnWatchlist: { mediaItemId: number }[];
  seasonsOnWatchlist: { seasonId: number | null }[];
  episodesOnWatchlist: { episodeId: number | null }[];
  firstUnwatchedEpisodesAndUnseenEpisodesCount: {
    mediaItemId: number;
    firstUnwatchedEpisodeId: number | null;
    unseenEpisodesCount: number | null;
  }[];
}) => {
  const justWatchProvidersByProviderId = _.keyBy(
    args.justWatchProviders,
    (item) => item.id
  );

  const justWatchAvailabilityByMediaItemId = _(args.justWatchAvailability)
    .groupBy((item) => item.mediaItemId)
    .mapValues((values) =>
      _(values)
        .sortBy((item) => item.displayPriority)
        .groupBy((item) => item.type)
        .mapValues((values) =>
          values
            .filter((value) => justWatchProvidersByProviderId[value.providerId])
            .map((value) => ({
              providerName:
                justWatchProvidersByProviderId[value.providerId].name,
              providerLogo: `/api/v1/img/get?id=${
                justWatchProvidersByProviderId[value.providerId].logo
              }`,
            }))
        )
        .value()
    )
    .value();

  const mediaItemRatingByMediaItemId = _.keyBy(
    args.mediaItemRatings,
    (item) => item.mediaItemId
  );

  const seasonRatingBySeasonId = _(args.mediaItemRatings)
    .filter(withDefinedPropertyFactory('seasonId'))
    .keyBy((item) => item.seasonId)
    .value();

  const episodeRatingByEpisodeId = _(args.mediaItemRatings)
    .filter(withDefinedPropertyFactory('episodeId'))
    .keyBy((item) => item.episodeId)
    .value();

  const mediaItemIdsOnWatchlist = new Set(
    args.mediaItemsOnWatchlist.map((item) => item.mediaItemId)
  );

  const seasonIdsOnWatchlist = new Set(
    args.seasonsOnWatchlist.map((item) => item.seasonId)
  );

  const episodeIdsOnWatchlist = new Set(
    args.episodesOnWatchlist.map((item) => item.episodeId)
  );

  const episodeByEpisodeId = _(args.episodes)
    .map((episode) => ({
      ...episode,
      userRating: episodeRatingByEpisodeId[episode.id] || null,
      onWatchlist: episodeIdsOnWatchlist.has(episode.id),
    }))
    .keyBy((item) => item.id)
    .value();

  const seasonBySeasonId = _(args.seasons)
    .map((season) => ({
      ...season,
      userRating: seasonRatingBySeasonId[season.id] || null,
      onWatchlist: seasonIdsOnWatchlist.has(season.id),
      poster: season.posterId ? `/api/v1/img/get?id=${season.posterId}` : null,
      // TODO: do this as well
      lastSeenAt: null,
      seen: null,
    }))
    .keyBy((item) => item.id)
    .value();

  const lastSeenByMediaItemId = _(args.lastSeenMediaItem)
    .filter(withDefinedPropertyFactory('mediaItemId'))
    .keyBy((item) => item.mediaItemId)
    .mapValues((item) => item.date)
    .value();

  const unseenEpisodesCountByMediaItemId = _(
    args.firstUnwatchedEpisodesAndUnseenEpisodesCount
  )
    .keyBy((item) => item.mediaItemId)
    .mapValues((item) => item.unseenEpisodesCount)
    .value();

  const firstUnwatchedEpisodeIdByMediaItemId = _(
    args.firstUnwatchedEpisodesAndUnseenEpisodesCount
  )
    .filter(withDefinedPropertyFactory('firstUnwatchedEpisodeId'))
    .keyBy((item) => item.mediaItemId)
    .mapValues((item) => episodeByEpisodeId[item.firstUnwatchedEpisodeId])
    .value();

  const mediaItemById = _(args.mediaItems)
    .map((mediaItem): MediaItemResponse => {
      const numberOfUpcomingEpisodes = mediaItem.needsDetails
        ? null
        : unseenEpisodesCountByMediaItemId[mediaItem.id] || null;

      const unseenEpisodesCount = mediaItem.needsDetails
        ? null
        : unseenEpisodesCountByMediaItemId[mediaItem.id] || 0;

      const airedEpisodesCount = mediaItem.needsDetails
        ? null
        : mediaItem.numberOfAiredEpisodes;

      const seenEpisodesCount =
        typeof airedEpisodesCount === 'number' &&
        typeof unseenEpisodesCount === 'number'
          ? airedEpisodesCount - unseenEpisodesCount
          : null;

      const lastSeenAt = lastSeenByMediaItemId[mediaItem.id] || null;

      const seen =
        mediaItem.mediaType === 'tv'
          ? seenEpisodesCount === 0
          : mediaItem.id in lastSeenByMediaItemId;

      const upcomingEpisode = mediaItem.upcomingEpisodeId
        ? episodeByEpisodeId[mediaItem.upcomingEpisodeId] || null
        : null;

      const lastAiredEpisode = mediaItem.lastAiredEpisodeId
        ? episodeByEpisodeId[mediaItem.lastAiredEpisodeId] || null
        : null;

      const lastAiring =
        (mediaItem.mediaType === 'tv'
          ? lastAiredEpisode?.releaseDate
          : mediaItem.releaseDate) || null;

      const nextAiring =
        (mediaItem.mediaType === 'tv'
          ? upcomingEpisode?.releaseDate
          : mediaItem.releaseDate) || null;

      const availability = justWatchAvailabilityByMediaItemId[mediaItem.id];

      return mediaItemResponseSchema.parse({
        ...mediaItemModelToMediaItemResponse(mediaItem),
        userRating: mediaItemRatingByMediaItemId[mediaItem.id] || null,
        onWatchlist: mediaItemIdsOnWatchlist.has(mediaItem.id),
        firstUnwatchedEpisode:
          firstUnwatchedEpisodeIdByMediaItemId[mediaItem.id] || null,
        airedEpisodesCount,
        upcomingEpisode,
        lastAiredEpisode,
        unseenEpisodesCount,
        seenEpisodesCount,
        numberOfUpcomingEpisodes,
        lastSeenAt,
        seen,
        lastAiring,
        nextAiring,
        availability,
      });
    })

    .keyBy((mediaItem) => mediaItem.id)
    .value();

  const getMediaItemById = (
    mediaItemId: number | null
  ): MediaItemResponse | null => {
    if (typeof mediaItemId === 'number') {
      return mediaItemById[mediaItemId] || null;
    }
    return null;
  };

  const getSeasonById = (seasonId: number | null): SeasonResponse | null => {
    if (typeof seasonId === 'number') {
      return seasonBySeasonId[seasonId] || null;
    }
    return null;
  };

  const getEpisodeById = (episodeId: number | null): EpisodeResponse | null => {
    if (typeof episodeId === 'number') {
      return episodeByEpisodeId[episodeId] || null;
    }
    return null;
  };

  return {
    getMediaItemById,
    getSeasonById,
    getEpisodeById,
  };
};
