import { Knex } from 'knex';
import _ from 'lodash';

import { h } from '../utils.js';
import { logger } from '../logger.js';

export const seenEpisodesCountRepository = {
  async recalculate(args: {
    trx: Knex.Transaction;
    userId?: number;
    mediaItemIds?: number[];
  }) {
    const { trx, userId, mediaItemIds } = args;

    if (mediaItemIds && mediaItemIds.length === 0) {
      return;
    }

    logger.debug(
      h`recalculating seen episodes count${
        userId ? ` for ${`user ${userId}`}` : ''
      } for ${mediaItemIds ? mediaItemIds.length : 'all'} media item${
        mediaItemIds && mediaItemIds.length > 1 ? 's' : ''
      }`
    );

    const addUserAndMediaItemWhere = <T extends object>(
      qb: Knex.QueryBuilder<T>
    ) => {
      if (mediaItemIds) {
        if (mediaItemIds.length === 1) {
          qb.where('mediaItemId', mediaItemIds[0]);
        } else {
          qb.whereIn('mediaItemId', mediaItemIds);
        }
      }

      if (userId) {
        qb.where('userId', userId);
      }
    };

    const seenHistory = await trx('seen')
      .modify(addUserAndMediaItemWhere)
      .whereNotNull('episodeId')
      .innerJoin('episode', 'episode.id', 'seen.episodeId')
      .where('isSpecialEpisode', false)
      .whereNotNull('releaseDate')
      .whereNot('releaseDate', '')
      .where('releaseDate', '<=', new Date().toISOString());

    const seenEpisodesCounts = _(seenHistory)
      .uniqBy((item) => [item.userId, item.episodeId].toString())
      .groupBy((item) => [item.userId, item.mediaItemId].toString())
      .mapValues((values) => ({
        userId: values[0].userId,
        mediaItemId: values[0].mediaItemId,
        seenEpisodesCount: values.length,
      }))
      .values()
      .value();

    await trx('seenEpisodesCount').modify(addUserAndMediaItemWhere).delete();

    if (seenEpisodesCounts.length === 0) {
      return;
    }

    const BATCH_SIZE = 100;

    if (seenEpisodesCounts.length > BATCH_SIZE) {
      await trx.batchInsert(
        'seenEpisodesCount',
        seenEpisodesCounts,
        BATCH_SIZE
      );
    } else {
      await trx('seenEpisodesCount').insert(seenEpisodesCounts);
    }
  },
} as const;
