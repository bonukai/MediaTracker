import { Knex } from 'knex';
import { logger } from '../logger.js';
import { h } from '../utils.js';

export const hasBeenSeenRepository = {
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
      h`recalculating hasBeenSeen ${
        userId ? `for ${`user ${userId}`}` : ''
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

    await trx('hasBeenSeen').modify(addUserAndMediaItemWhere).delete();

    await trx
      .insert((db: Knex.QueryBuilder) =>
        db
          .from('seen')
          .leftJoin('mediaItem', 'mediaItem.id', 'seen.mediaItemId')
          .where('mediaType', '<>', 'tv')
          .modify(addUserAndMediaItemWhere)
          .distinct(['userId', 'mediaItemId'])
      )
      .into('hasBeenSeen');

    await trx
      .insert((db: Knex.QueryBuilder) =>
        db
          .from('mediaItem')
          .where('mediaType', 'tv')
          .leftJoin(
            'seenEpisodesCount',
            'mediaItem.id',
            'seenEpisodesCount.mediaItemId'
          )
          .where('seenEpisodesCount', trx.ref('numberOfAiredEpisodes'))
          .modify(addUserAndMediaItemWhere)
          .select('userId', 'mediaItemId')
      )
      .into('hasBeenSeen');
  },
} as const;
