import { createExpressRoute } from 'typescript-routes-to-openapi-server';

import { Database } from 'src/dbconfig';
import { List } from 'src/entity/list';

export type ListsItemResponse = Omit<List, 'userId'> & {
  itemsCount: number;
  user: {
    id: number;
    name: string;
  };
};

export type ListsResponse = ListsItemResponse[];

/**
 * @openapi_tags Lists
 */
export class ListsController {
  /**
   * @openapi_operationId Get user's lists
   */
  getLists = createExpressRoute<{
    method: 'get';
    path: '/api/lists';
    requestQuery: {
      userId?: number;
      mediaItemId?: number;
      seasonId?: number;
      episodeId?: number;
    };
    responseBody: ListsResponse;
  }>(async (req, res) => {
    const { userId, mediaItemId, seasonId, episodeId } = req.query;

    const currentUserId = Number(req.user);

    const user = await Database.knex('user')
      .select('id', 'name')
      .where('id', userId)
      .first();

    if (!user) {
      res.sendStatus(400);
      return;
    }

    const lists = await getUserLists({
      userId: user.id,
      currentUserId: currentUserId,
      mediaItemId: mediaItemId,
      seasonId: seasonId,
      episodeId: episodeId,
    });

    res.send(lists);
  });
}

export const getUserLists = async (args: {
  userId: number;
  currentUserId: number;
  mediaItemId?: number;
  seasonId?: number;
  episodeId?: number;
}): Promise<ListsResponse> => {
  const { userId, currentUserId, mediaItemId, seasonId, episodeId } = args;

  const qb = Database.knex('list')
    .select(
      'list.*',
      'itemsCount',
      'user.id as user.id',
      'user.name as user.name'
    )
    .where('userId', userId)
    .where(currentUserId === userId ? {} : { privacy: 'public' })
    .leftJoin(
      (qb) =>
        qb
          .select('listId')
          .count('listId', {
            as: 'itemsCount',
          })
          .from('listItem')
          .groupBy('listId')
          .as('count'),
      'count.listId',
      'list.id'
    )
    .leftJoin('user', 'list.userId', 'user.id');

  if (episodeId || seasonId || mediaItemId) {
    qb.innerJoin(
      (qb) =>
        qb
          .select('listId')
          .from('listItem')
          .where(
            episodeId
              ? {
                  episodeId: episodeId,
                }
              : seasonId
              ? {
                  seasonId: seasonId,
                  episodeId: null,
                }
              : {
                  mediaItemId: mediaItemId,
                  seasonId: null,
                  episodeId: null,
                }
          )
          .groupBy('listId')
          .as('listItem'),
      'listItem.listId',
      'list.id'
    );
  }

  const res = await qb;

  return res.map((row) => ({
    id: row.id,
    name: row.name,
    privacy: row.privacy,
    sortBy: row.sortBy,
    sortOrder: row.sortOrder,
    description: row.description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    slug: row.slug,
    itemsCount: row.itemsCount,
    rank: Number(row.rank),
    allowComments: Boolean(row.allowComments),
    displayNumbers: Boolean(row.displayNumbers),
    isWatchlist: Boolean(row.isWatchlist),
    user: {
      id: row['user.id'],
      name: row['user.name'],
    },
  }));
};
