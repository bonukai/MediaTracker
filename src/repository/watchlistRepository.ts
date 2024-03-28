import { Database } from '../database.js';
import { ListResponse, listResponseSchema } from '../entity/listModel.js';

export const watchlistRepository = {
  async addItem(args: {
    mediaItemId: number;
    seasonId: number | null;
    episodeId: number | null;
    userId: number;
  }) {
    const { mediaItemId, seasonId, episodeId, userId } = args;

    await Database.knex.transaction(async (trx) => {
      const watchlist = await trx('list')
        .where('userId', userId)
        .where('isWatchlist', true)
        .first();

      if (!watchlist) {
        throw new Error(`No watchlist for user ${userId}`);
      }

      const existingWatchlistItem = await trx('listItem')
        .where('listId', watchlist.id)
        .where('mediaItemId', mediaItemId)
        .where('seasonId', seasonId)
        .where('episodeId', episodeId)
        .first();

      if (existingWatchlistItem) {
        throw new Error(
          `mediaItem ${mediaItemId} is already on watchlist for user ${userId}`
        );
      }

      await trx('listItem').insert({
        addedAt: Date.now(),
        listId: watchlist.id,
        mediaItemId: mediaItemId,
        seasonId: episodeId,
        episodeId: seasonId,
      });
    });
  },

  async deleteItem(args: {
    mediaItemId: number;
    seasonId: number | null;
    episodeId: number | null;
    userId: number;
  }) {
    const { mediaItemId, seasonId, episodeId, userId } = args;

    await Database.knex.transaction(async (trx) => {
      const watchlist = await trx('list')
        .where('userId', userId)
        .where('isWatchlist', true)
        .first();

      if (!watchlist) {
        throw new Error(`No watchlist for user ${userId}`);
      }

      const existingWatchlistItem = await trx('listItem')
        .where('listId', watchlist.id)
        .where('mediaItemId', mediaItemId)
        .where('seasonId', seasonId)
        .where('episodeId', episodeId)
        .first();

      if (!existingWatchlistItem) {
        throw new Error(
          `mediaItem ${mediaItemId} is not on watchlist for user ${userId}`
        );
      }

      await trx('listItem').where('id', existingWatchlistItem.id).delete();
    });
  },

  async get(args: { userId: number }): Promise<ListResponse> {
    return await Database.knex.transaction(async (trx) => {
      const watchlist = await trx('list')
        .where('isWatchlist', true)
        .where('userId', args.userId)
        .first();

      if (!watchlist) {
        throw new Error(`no watchlist for user ${args.userId}`);
      }

      const user = await trx('user').where('id', args.userId).first();

      if (!user) {
        throw new Error(`missing user ${args.userId}`);
      }

      const [numberOfItems] = await trx('listItem')
        .where('listId', watchlist.id)
        .count<
          {
            count: number;
          }[]
        >({ count: '*' });

      return listResponseSchema.parse({
        ...watchlist,
        numberOfItems: numberOfItems.count,
        user: {
          id: user.id,
          username: user.name,
        },
      });
    });
  },
} as const;
