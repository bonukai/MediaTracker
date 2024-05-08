import { Database } from '../database.js';
import { ListResponse, listResponseSchema } from '../entity/listModel.js';

export const listItemRepository = {
  async addItem(args: {
    mediaItemId: number;
    seasonId: number | null;
    episodeId: number | null;
    listId: number;
    userId: number;
  }) {
    const { mediaItemId, seasonId, episodeId, userId, listId } = args;

    await Database.knex.transaction(async (trx) => {
      // TODO: Check if list was shared
      const list = await trx('list')
        .where('userId', userId)
        .where('id', listId)
        .first();

      if (!list) {
        throw new Error(`No list for user ${userId} with id ${listId}`);
      }

      const existingItem = await trx('listItem')
        .where('listId', list.id)
        .where('mediaItemId', mediaItemId)
        .where('seasonId', seasonId)
        .where('episodeId', episodeId)
        .first();

      if (existingItem) {
        throw new Error(
          `mediaItem ${mediaItemId} is already on list ${listId}`
        );
      }

      await trx('listItem').insert({
        addedAt: Date.now(),
        listId: listId,
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
    listId: number;
    userId: number;
  }) {
    const { mediaItemId, seasonId, episodeId, userId, listId } = args;

    await Database.knex.transaction(async (trx) => {
      const list = await trx('list')
        .where('userId', userId)
        .where('id', listId)
        .first();

      if (!list) {
        throw new Error(`No list for user ${userId} with id ${listId}`);
      }

      const existingItem = await trx('listItem')
        .where('mediaItemId', mediaItemId)
        .where('seasonId', seasonId)
        .where('episodeId', episodeId)
        .where('listId', list.id)
        .first();

      if (!existingItem) {
        throw new Error(`mediaItem ${mediaItemId} is not on list ${listId}`);
      }

      await trx('listItem').where('id', existingItem.id).delete();
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
