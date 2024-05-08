import _ from 'lodash';

import { Database } from '../database.js';
import {
  ListItemModel,
  ListItemResponse,
  listItemResponseSchema,
  ListItemsFilters,
  ListItemsResponse,
  ListModel,
  ListPrivacy,
  ListResponse,
  listResponseSchema,
  ListSortBy,
  ListSortOrder,
} from '../entity/listModel.js';
import { Knex } from 'knex';

import { is, toReleaseDateFormat } from '../utils.js';
import { mediaItemRepository } from './mediaItemRepository.js';
import { TRPCError } from '@trpc/server';

export const listRepository = {
  updateList: async (args: {
    id: number;
    userId: number;
    name: string;
    description?: string;
    privacy?: ListPrivacy;
    sortBy?: ListSortBy;
    sortOrder?: ListSortOrder;
  }): Promise<ListModel> => {
    const { userId, name, description, privacy, sortBy, sortOrder, id } = args;

    if (id == undefined || userId == undefined) {
      throw new Error('id and userId are required params');
    }

    if (name?.trim().length === 0) {
      throw new Error(`List name cannot be empty`);
    }

    const updatedAt = new Date().getTime();

    return await Database.knex.transaction(async (trx) => {
      const list = await trx('list').where('id', id).first();

      if (!list) {
        throw new Error(`No list with id ${id}`);
      }

      if (list.userId !== userId) {
        throw new Error('only the list owner can modify it');
      }

      const listWithTheSameName = await trx('list')
        .where('userId', userId)
        .where('name', name)
        .whereNot('id', id)
        .first();

      if (listWithTheSameName) {
        throw new Error(`There already exists list with a name "${name}"`);
      }

      await trx('list')
        .update({
          ...(list.isWatchlist ? {} : { name: name }),
          privacy: privacy,
          description: description,
          updatedAt: updatedAt,
          sortBy: sortBy,
          sortOrder: sortOrder,
        })
        .where('id', id);

      const updatedList = await trx('list').where('id', id).first();

      if (!updatedList) {
        throw new Error(`failed to fetch updated list with id ${id}`);
      }

      return updatedList;
    });
  },

  createList: async (args: {
    name: string;
    description?: string;
    privacy?: ListPrivacy;
    sortBy?: ListSortBy;
    sortOrder?: ListSortOrder;
    userId: number;
    isWatchlist?: boolean;
    traktId?: number;
  }): Promise<ListModel> => {
    const {
      userId,
      name,
      description,
      privacy,
      sortBy,
      sortOrder,
      isWatchlist,
      traktId,
    } = args;

    if (name.trim().length === 0) {
      throw new Error(`List name cannot be empty`);
    }

    const createdAt = new Date().getTime();

    const [insertedList] = await Database.knex('list').insert(
      {
        userId: userId,
        name: name,
        privacy: privacy || 'private',
        description: description,
        sortBy: sortBy || 'last-seen',
        sortOrder: sortOrder || 'desc',
        createdAt: createdAt,
        updatedAt: createdAt,
        isWatchlist: isWatchlist || false,
        traktId: traktId,
      },
      '*'
    );

    return {
      ...insertedList,
      displayNumbers: Boolean(insertedList.displayNumbers),
      allowComments: Boolean(insertedList.allowComments),
      isWatchlist: Boolean(insertedList.isWatchlist),
    };
  },

  deleteList: async (args: {
    listId: number;
    userId: number;
  }): Promise<boolean> => {
    const { listId, userId } = args;

    return await Database.knex.transaction(async (trx) => {
      const list = await trx('list')
        .where('userId', userId)
        .where('id', listId)
        .where('isWatchlist', false)
        .first();

      if (!list) {
        return false;
      }

      await trx('listItem').delete().where('listId', listId);
      const res = await trx('list').delete().where('id', listId);
      return res > 0;
    });
  },

  getList: async (args: {
    listId: number;
    userId: number;
  }): Promise<ListResponse> => {
    const { listId, userId } = args;

    const res = await Database.knex('list')
      .select('list.*', 'user.name AS user.name')
      .where('list.id', listId)
      .where((qb) =>
        qb.where('list.userId', userId).orWhere('list.privacy', 'public')
      )
      .select({
        numberOfItems: Database.knex('listItem')
          .where('listId', listId)
          .count(),
      })
      .leftJoin('user', 'user.id', 'list.userId')
      .first();

    if (!res) {
      throw new Error(`no list with id ${listId}`);
    }

    const list = listResponseSchema.parse({
      ...res,
      user: {
        id: res.userId,
        username: res['user.name'],
      },
    });

    if (list.privacy === 'private' && list.user.id !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'this list is private',
      });
    }

    return list;
  },

  async getListItems(args: {
    listId: number;
    userId: number;
  }): Promise<ListItemsResponse> {
    const { listId, userId } = args;

    const res = await Database.knex.transaction(async (trx) => {
      const list = await trx('list').where('id', listId).first();

      if (!list) {
        throw new Error(`no list with id ${listId}`);
      }

      const user = await trx('user').where('id', list.userId).first();

      if (!user) {
        throw new Error(`no user with id ${list.userId}`);
      }

      const listItems = await trx('listItem').where('listId', listId);

      const mediaItemDetails = await mediaItemRepository.userDetails({
        trx: trx,
        mediaItemIds: listItems.map((item) => item.mediaItemId),
        userId: userId,
      });

      return {
        list,
        user,
        listItems,
        mediaItemDetails,
      };
    });

    const { getEpisodeById, getMediaItemById, getSeasonById } =
      res.mediaItemDetails;

    const listItems = res.listItems.map((item): ListItemResponse => {
      const mediaItem = getMediaItemById(item.mediaItemId);

      if (!mediaItem) {
        throw new Error(
          `mediaItem with id ${item.mediaItemId} does not exists`
        );
      }

      return {
        id: item.id,
        addedAt: new Date(item.addedAt).getTime(),
        type: item.episodeId
          ? 'episode'
          : item.seasonId
            ? 'season'
            : 'mediaItem',
        mediaItem: mediaItem,
        season: getSeasonById(item.seasonId),
        episode: getEpisodeById(item.episodeId),
      };
    });

    return {
      ...listResponseSchema.parse({
        ...res.list,
        numberOfItems: listItems.length,
        user: {
          id: res.list.userId,
          username: res.user.name,
        },
      }),
      items: listItems,
    };
  },

  async getLists(args: { userId: number }): Promise<ListResponse[]> {
    const { userId } = args;

    const res = await Database.knex.transaction(async (trx) => {
      const user = await trx('user').where('id', userId).first();

      if (!user) {
        throw new Error(`no user with id ${userId}`);
      }

      const lists = await trx('list').where({
        userId: userId,
      });

      const listItemsCount = await trx('listItem')
        .select('listId')
        .count({ numberOfItems: '*' })
        .whereIn(
          'listId',
          lists.map((item) => item.id)
        )
        .groupBy('listId');

      return { user, lists, listItemsCount };
    });

    const listItemsCountMap = _(res.listItemsCount)
      .keyBy((item) => item.listId)
      .mapValues((item) => item.numberOfItems || 0)
      .value();

    return res.lists
      .map((item) => ({
        ...item,
        numberOfItems: listItemsCountMap[item.id] || 0,
        user: {
          id: userId,
          username: res.user.name,
        },
      }))
      .map((item) => listResponseSchema.parse(item));
  },

  async getListItemsPaginated(args: GetListItemsArgs) {
    const { listId, userId, page, numberOfItemsPerPage } = args;

    const res = await Database.knex.transaction(async (trx) => {
      const countRes = await trx('listItem')
        .where('listId', listId)
        .leftJoin('mediaItem', 'listItem.mediaItemId', 'mediaItem.id')
        .modify((qb) => filterQuery(qb, args))
        .count({ count: '*' });

      const listItems: ListItemModel[] = await trx('listItem')
        .where('listId', listId)
        .leftJoin('mediaItem', 'listItem.mediaItemId', 'mediaItem.id')
        .modify((qb) => filterQuery(qb, args))
        .modify((qb) => sortQuery(qb, args))
        .select('listItem.*')
        .offset(numberOfItemsPerPage * (page - 1))
        .limit(numberOfItemsPerPage);

      const uniqMediaItemIds = _(listItems)
        .map((item) => item.mediaItemId)
        .uniq()
        .value();

      const data = await mediaItemRepository.userDetails({
        trx,
        mediaItemIds: uniqMediaItemIds,
        seasonIds: listItems.map((item) => item.seasonId).filter(is),
        episodeIds: listItems.map((item) => item.episodeId).filter(is),
        userId,
      });

      const items = listItems.map((item) =>
        listItemResponseSchema.parse({
          addedAt: item.addedAt,
          id: item.id,
          type: item.episodeId
            ? 'episode'
            : item.seasonId
              ? 'season'
              : 'mediaItem',
          episode: data.getEpisodeById(item.episodeId),
          season: data.getSeasonById(item.seasonId),
          mediaItem: data.getMediaItemById(item.mediaItemId),
        })
      );

      const count = Number(countRes.at(0)?.count || 0);

      return {
        items,
        count,
      };
    });

    const totalNumberOfItems = res.count;
    const totalNumberOfPages = Math.ceil(
      totalNumberOfItems / numberOfItemsPerPage
    );

    return {
      page,
      totalNumberOfPages,
      totalNumberOfItems,
      items: res.items,
    };
  },
} as const;

type GetListItemsArgs = {
  listId: number;
  userId: number;
  page: number;
  numberOfItemsPerPage: number;
  orderBy?: ListSortBy;
  sortOrder?: ListSortOrder;
  filters?: ListItemsFilters;
};

const filterQuery = <T extends object>(
  query: Knex.QueryBuilder<T>,
  args: GetListItemsArgs
) => {
  const { filters, userId } = args;

  if (filters?.title) {
    query.whereLike('mediaItem.title', `%${filters.title}%`);
  }

  if (filters?.itemTypes) {
    query.whereIn('mediaItem.mediaType', filters.itemTypes);
  }

  if (typeof filters?.withUserRating === 'boolean') {
    query.leftJoin(
      Database.knex.ref('userRating').as('mediaItemUserRatingFilter'),
      (qb) =>
        qb
          .on('listItem.mediaItemId', 'mediaItemUserRatingFilter.mediaItemId')
          .onNull('mediaItemUserRatingFilter.seasonId')
          .onNull('mediaItemUserRatingFilter.episodeId')
          .onVal('mediaItemUserRatingFilter.userId', userId)
    );

    if (filters.withUserRating === true) {
      query.whereNotNull('mediaItemUserRatingFilter.rating');
    } else if (filters.withUserRating === false) {
      query.whereNull('mediaItemUserRatingFilter.rating');
    }
  }

  if (filters?.justWatchProviders) {
    query
      .leftJoin(
        'justWatchAvailability',
        'listItem.mediaItemId',
        'justWatchAvailability.mediaItemId'
      )
      .whereIn('justWatchAvailability.providerId', filters.justWatchProviders)
      .groupBy(['justWatchAvailability.mediaItemId']);
  }

  if (typeof filters?.inProgress === 'boolean') {
    // TODO: add support for seasons
    query.leftJoin(Database.knex.ref('progress').as('progressFilter'), (qb) =>
      qb
        .on('listItem.mediaItemId', 'progressFilter.mediaItemId')
        .onNull('listItem.episodeId')
        .onNull('listItem.seasonId')
        .onVal('progressFilter.userId', userId)
    );
    if (filters.inProgress === true) {
      query
        .whereNotNull('progressFilter.progress')
        .where('progressFilter.progress', '<', 1);
    } else if (filters.inProgress === false) {
      query.whereNull('progressFilter.progress');
    }
  }

  if (typeof filters?.seen === 'boolean') {
    // TODO: add support for seasons and episodes
    // TODO: slowest part, try to optimize it
    // query
    //   .leftJoin(
    //     (qb) =>
    //       qb
    //         .select('mediaItemId')
    //         .from('seen')
    //         .where('userId', userId)
    //         .groupBy('mediaItemId')
    //         .as('lastSeenFilter'),
    //     (qb) => qb.on('listItem.mediaItemId', 'lastSeenFilter.mediaItemId')
    //   )
    //   .leftJoin(
    //     (qb) =>
    //       qb
    //         .count('*', { as: 'unseenEpisodesCount' })
    //         .select('tvShowId')
    //         .from('episode')
    //         .leftJoin(
    //           (qb) => qb.from('seen').where('userId', userId).as('seen3'),
    //           'seen3.episodeId',
    //           'episode.id'
    //         )
    //         .where('isSpecialEpisode', false)
    //         .whereNull('seen3.id')
    //         .whereNot('episode.releaseDate', '')
    //         .whereNot('episode.releaseDate', null)
    //         .where('episode.releaseDate', '<=', currentDateString)
    //         .groupBy('tvShowId')
    //         .as('aaa'),
    //     (qb) => qb.on('listItem.mediaItemId', 'aaa.tvShowId')
    //   );

    // if (filters.seen === true) {
    //   query.where((qb) =>
    //     qb
    //       .orWhere((qb) =>
    //         qb
    //           .where('mediaItem.mediaType', '<>', 'tv')
    //           .whereNotNull('lastSeenFilter.mediaItemId')
    //       )
    //       .orWhere((qb) =>
    //         qb
    //           .where('mediaItem.mediaType', '=', 'tv')
    //           .where((qb) =>
    //             qb
    //               .where('aaa.unseenEpisodesCount', '=', 0)
    //               .orWhereNull('aaa.unseenEpisodesCount')
    //           )
    //       )
    //   );
    // } else if (filters.seen === false) {
    //   query.where((qb) =>
    //     qb
    //       .orWhere((qb) =>
    //         qb
    //           .where('mediaItem.mediaType', '<>', 'tv')
    //           .whereNull('lastSeenFilter.mediaItemId')
    //       )
    //       .orWhere((qb) =>
    //         qb
    //           .where('mediaItem.mediaType', '=', 'tv')
    //           .where('aaa.unseenEpisodesCount', '>', 0)
    //       )
    //   );
    // }

    query
      .select({
        unseenEpisodesCount: Database.knex.raw(
          '"mediaItem"."numberOfAiredEpisodes" - "seenEpisodesCount"."seenEpisodesCount"'
        ),
        seenEpisodesCountUserId: 'seenEpisodesCount.userId',
      })
      .leftJoin(
        (qb) =>
          qb
            .select('mediaItemId')
            .from('seen')
            .where('userId', userId)
            .groupBy('mediaItemId')
            .as('lastSeenFilter'),
        (qb) => qb.on('listItem.mediaItemId', 'lastSeenFilter.mediaItemId')
      )
      .leftJoin('seenEpisodesCount', (qb) =>
        qb
          .on('listItem.mediaItemId', 'seenEpisodesCount.mediaItemId')
          .onNull('listItem.seasonId')
          .onNull('listItem.episodeId')
          .onVal('seenEpisodesCount.userId', userId)
      );

    if (filters.seen === true) {
      query.where((qb) =>
        qb
          .orWhere((qb) =>
            qb
              .where('mediaItem.mediaType', '<>', 'tv')
              .whereNotNull('lastSeenFilter.mediaItemId')
          )
          .orWhere((qb) =>
            qb
              .where('mediaItem.mediaType', '=', 'tv')
              .where((qb) => qb.where('unseenEpisodesCount', '=', 0))
          )
      );
    } else if (filters.seen === false) {
      query.where((qb) =>
        qb
          .orWhere((qb) =>
            qb
              .where('mediaItem.mediaType', '<>', 'tv')
              .whereNull('lastSeenFilter.mediaItemId')
          )
          .orWhere((qb) =>
            qb
              .where('mediaItem.mediaType', '=', 'tv')
              .where((qb) =>
                qb
                  .orWhere('unseenEpisodesCount', '>', 0)
                  .orWhereNull('unseenEpisodesCount')
              )
          )
      );
    }
  }
};

const sortQuery = <T extends object>(
  query: Knex.QueryBuilder<T>,
  args: GetListItemsArgs
) => {
  const { userId } = args;
  const sortOrder = args.sortOrder || 'asc';
  const orderBy = args.orderBy || 'listed';

  const currentDateString = toReleaseDateFormat(new Date());

  if (orderBy === 'listed') {
    query.orderBy('addedAt', sortOrder);
  } else if (orderBy === 'title') {
    query.orderBy('mediaItem.title', sortOrder);
  } else if (orderBy === 'release-date') {
    query.orderBy('mediaItem.releaseDate', sortOrder);
  } else if (orderBy === 'user-rating') {
    query
      .leftJoin('userRating', (qb) =>
        qb
          .on('listItem.mediaItemId', 'userRating.mediaItemId')
          .on((qb) =>
            qb
              .orOn('listItem.seasonId', 'userRating.seasonId')
              .orOn((qb) =>
                qb.onNull('listItem.seasonId').onNull('userRating.seasonId')
              )
          )
          .on((qb) =>
            qb
              .orOn('listItem.episodeId', 'userRating.episodeId')
              .orOn((qb) =>
                qb.onNull('listItem.episodeId').onNull('userRating.episodeId')
              )
          )
          .onVal('userRating.userId', userId)
      )
      .orderBy('userRating.rating', sortOrder);
  } else if (orderBy === 'media-type') {
    query.orderBy('mediaItem.mediaType', sortOrder);
  } else if (orderBy === 'status') {
    query.orderBy('mediaItem.status', sortOrder);
  } else if (orderBy === 'unseen-episodes-count') {
    // TODO: Add support for seasons
    if (typeof args.filters?.seen !== 'boolean') {
      query
        .select({
          unseenEpisodesCount: Database.knex.raw(
            '"mediaItem"."numberOfAiredEpisodes" - "seenEpisodesCountSortOrder"."seenEpisodesCount"'
          ),
          seenEpisodesCountUserId: 'userId',
        })
        .leftJoin(
          Database.knex
            .ref('seenEpisodesCount')
            .as('seenEpisodesCountSortOrder'),
          (qb) =>
            qb
              .on(
                'listItem.mediaItemId',
                'seenEpisodesCountSortOrder.mediaItemId'
              )
              .onNull('listItem.seasonId')
              .onNull('listItem.episodeId')
              .onVal('seenEpisodesCountUserId', userId)
        );
    }

    query.orderBy('unseenEpisodesCount', sortOrder);
  } else if (orderBy === 'progress') {
    query
      .leftJoin('progress', (qb) =>
        qb
          .on('listItem.mediaItemId', 'progress.mediaItemId')
          .on((qb) =>
            qb
              .orOn('listItem.episodeId', 'progress.episodeId')
              .orOn((qb) =>
                qb.onNull('listItem.episodeId').onNull('progress.episodeId')
              )
          )
          .onNull('listItem.seasonId')
          .onVal('progress.userId', userId)
      )
      .orderBy('progress.progress', sortOrder);
  } else if (orderBy === 'last-seen') {
    //  TODO: add support for seasons and episodes
    query
      .leftJoin(
        (qb) =>
          qb
            .select('mediaItemId')
            .max('date', { as: 'date' })
            .from('seen')
            .where('userId', userId)
            .groupBy('mediaItemId')
            .as('lastSeen'),
        (qb) => qb.on('listItem.mediaItemId', 'lastSeen.mediaItemId')
      )
      .orderBy('lastSeen.date', sortOrder);
  } else if (orderBy === 'next-airing') {
    query
      .leftJoin('episode', 'mediaItem.upcomingEpisodeId', 'episode.id')
      .where((qb) =>
        qb
          .orWhere((qb) =>
            qb
              .where('mediaItem.mediaType', '<>', 'tv')
              .where('mediaItem.releaseDate', '>', currentDateString)
          )
          .orWhere((qb) =>
            qb
              .where('mediaItem.mediaType', '=', 'tv')
              .where('episode.releaseDate', '>', currentDateString)
          )
      )
      .orderByRaw(
        `CASE
          WHEN "mediaItem"."mediaType" = 'tv' THEN "episode"."releaseDate"
          ELSE "mediaItem"."releaseDate"
        END ${sortOrder} NULLS LAST`
      );
  } else if (orderBy === 'last-airing') {
    query
      .leftJoin('episode', 'mediaItem.lastAiredEpisodeId', 'episode.id')
      .where((qb) =>
        qb
          .orWhere((qb) =>
            qb
              .where('mediaItem.mediaType', '<>', 'tv')
              .where('mediaItem.releaseDate', '<=', currentDateString)
          )
          .orWhere((qb) =>
            qb
              .where('mediaItem.mediaType', '=', 'tv')
              .where('episode.releaseDate', '<=', currentDateString)
          )
      )
      .orderByRaw(
        `CASE
          WHEN "mediaItem"."mediaType" = 'tv' THEN "episode"."releaseDate"
          ELSE "mediaItem"."releaseDate"
        END ${sortOrder} NULLS LAST`
      );
  }
};
