import _ from 'lodash';

import { Database } from '../database.js';
import {
  isDefined,
  splitDeleteWhereInQuery,
  splitWhereInQuery,
} from '../utils.js';
import { mediaItemRepository } from './mediaItemRepository.js';
import { seenEpisodesCountRepository } from './seenEpisodesCountRepository.js';

export const seenRepository = {
  async add(args: {
    mediaItemId: number;
    userId: number;
    date?: number | null;
    duration?: number | null;
  }): Promise<number> {
    const { mediaItemId, date, duration, userId } = args;

    const res = await Database.knex.transaction(async (trx) => {
      const mediaItem = await trx('mediaItem').where('id', mediaItemId).first();

      if (!mediaItem) {
        throw new Error(`No mediaItem with id ${mediaItemId}`);
      }

      if (mediaItem.mediaType === 'tv') {
        throw new Error(`This route cannot be used with a Tv Show`);
      }

      const res = await trx('seen')
        .insert({
          mediaItemId: mediaItemId,
          userId: userId,
          date: date || null,
          duration: duration || mediaItem.runtime,
        })
        .returning('id');

      const watchlist = await trx('list')
        .where('userId', userId)
        .where('isWatchlist', true)
        .first();

      if (!watchlist) {
        throw new Error(`No watchlist for user ${userId}`);
      }

      await trx('listItem')
        .where('listId', watchlist.id)
        .where('mediaItemId', mediaItemId)
        .delete();

      await seenEpisodesCountRepository.recalculate({
        trx,
        mediaItemIds: [mediaItemId],
        userId,
      });

      return res[0].id;
    });

    return res;
  },

  async addEpisodes(args: {
    mediaItemId: number;
    userId: number;
    episodes: {
      episodeId: number;
      date?: number | null;
      duration?: number | null;
    }[];
  }): Promise<{ id: number }[]> {
    const { mediaItemId, userId, episodes } = args;

    return await Database.knex.transaction(async (trx) => {
      const mediaItem = await trx('mediaItem').where('id', mediaItemId).first();

      if (!mediaItem) {
        throw new Error(`No mediaItem with id ${mediaItemId}`);
      }

      if (mediaItem.mediaType !== 'tv') {
        throw new Error(`This route can only be used with a Tv Show`);
      }

      const episodesInDatabase = await trx('episode').where(
        'tvShowId',
        mediaItemId
      );

      const episodeById = _.keyBy(episodesInDatabase, (item) => item.id);

      const res = await Promise.all(
        episodes.map(async (episode) => {
          const episodeInDb = episodeById[episode.episodeId];

          if (!episodeById) {
            throw new Error(
              `episode with id ${episode.episodeId} does not exist`
            );
          }

          const [res] = await trx('seen')
            .insert({
              mediaItemId: mediaItemId,
              episodeId: episode.episodeId,
              userId: userId,
              date: episode.date || null,
              duration:
                episode.duration ||
                episodeInDb.runtime ||
                mediaItem.runtime ||
                null,
            })
            .returning('id');

          return res;
        })
      );

      await seenEpisodesCountRepository.recalculate({
        trx,
        mediaItemIds: [mediaItemId],
        userId,
      });

      return res;
    });
  },
  async delete(args: { seenId: number; userId: number }) {
    const { seenId, userId } = args;

    await Database.knex.transaction(async (trx) => {
      const seenEntry = await trx('seen')
        .where('id', seenId)
        .where('userId', userId)
        .first();

      if (!seenEntry) {
        throw new Error(
          `seen entry with id ${seenId} and userId ${userId} does not exist`
        );
      }

      await trx('seen').where('id', seenId).where('userId', userId).delete();

      const mediaItem = await trx('mediaItem')
        .where('id', seenEntry.mediaItemId)
        .first();

      if (!mediaItem) {
        throw new Error(`No mediaItem with id ${seenEntry.mediaItemId}`);
      }

      await seenEpisodesCountRepository.recalculate({
        trx,
        mediaItemIds: [mediaItem.id],
        userId,
      });
    });
  },
  async deleteMany(args: { data: { seenId: number }[]; userId: number }) {
    const { data, userId } = args;

    await Database.knex.transaction(async (trx) => {
      const existingSeenTransactions = await splitWhereInQuery(
        data.map((item) => item.seenId),
        (chunk) => trx('seen').whereIn('id', chunk).where('userId', userId)
      );

      const seenIdSet = new Set(
        existingSeenTransactions.map((item) => item.id)
      );

      const missingItems = data.filter((item) => !seenIdSet.has(item.seenId));

      if (missingItems.length > 0) {
        throw new Error(
          `invalid seen entries for userId ${userId}: ${missingItems
            .map((item) => item.seenId)
            .join(', ')}`
        );
      }

      await splitDeleteWhereInQuery(
        data.map((item) => item.seenId),
        (chunk) =>
          trx('seen').whereIn('id', chunk).where('userId', userId).delete()
      );

      await seenEpisodesCountRepository.recalculate({
        trx,
        userId,
        mediaItemIds: [existingSeenTransactions[0].mediaItemId],
      });
    });
  },
  async getSeenCountByMonth(args: { userId: number }) {
    const { userId } = args;

    return await Database.knex('seen')
      .count({ count: '*' })
      .select<{ count: number; month: number | null }[]>('month')
      .where('userId', userId)
      .groupBy('month')
      .orderBy('month', 'desc', 'last');
  },
  async getSeenCountByDay(args: { userId: number }) {
    const { userId } = args;

    return await Database.knex('seen')
      .count({ count: '*' })
      .select<{ count: number; day: number | null }[]>('day')
      .where('userId', userId)
      .groupBy('day')
      .orderBy('day', 'desc', 'last');
  },
  async getHistoryPaginated(args: {
    userId: number;
    page: number;
    numberOfItemsPerPage: number;
  }) {
    const { userId, page, numberOfItemsPerPage } = args;

    const res = await Database.knex.transaction(async (trx) => {
      const query = trx('seen').where('userId', userId);

      const countRes = await query.clone().count({ count: '*' });
      const seen = await query
        .clone()
        .orderBy('date', 'desc')
        .offset(numberOfItemsPerPage * (page - 1))
        .limit(numberOfItemsPerPage);

      const count = Number(countRes.at(0)?.count || 0);

      const details = await mediaItemRepository.userDetails({
        userId,
        trx,
        mediaItemIds: seen.map((item) => item.mediaItemId),
        episodeIds: seen.map((item) => item.episodeId).filter(isDefined),
      });

      return { seen, details, count };
    });

    const totalNumberOfItems = res.count;
    const totalNumberOfPages = Math.ceil(
      totalNumberOfItems / numberOfItemsPerPage
    );

    return {
      page: page,
      totalNumberOfItems,
      totalNumberOfPages,
      items: res.seen.map((item) => ({
        seenId: item.id,
        seenAt: item.date || null,
        duration: item.duration || null,
        mediaItem: res.details.getMediaItemById(item.mediaItemId)!,
        episode: res.details.getEpisodeById(item.episodeId || null),
      })),
    };
  },
  async getHistoryCursor(args: {
    userId: number;
    order: 'asc' | 'desc';
    fromDate: number;
    toDate: number;
  }) {
    const { userId, fromDate, toDate, order } = args;

    const res = await Database.knex.transaction(async (trx) => {
      const seen = await trx('seen')
        .where('userId', userId)
        .whereBetween('date', [fromDate, toDate]);

      const details = await mediaItemRepository.userDetails({
        userId,
        trx,
        mediaItemIds: seen.map((item) => item.mediaItemId),
        episodeIds: seen.map((item) => item.episodeId).filter(isDefined),
      });

      return { seen: seen, details };
    });

    return res.seen.map((item) => ({
      seenId: item.id,
      seenAt: item.date || null,
      duration: item.duration || null,
      mediaItem: res.details.getMediaItemById(item.mediaItemId)!,
      episode: res.details.getEpisodeById(item.episodeId || null),
    }));
  },
} as const;
