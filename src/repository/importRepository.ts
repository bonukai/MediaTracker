import _ from 'lodash';
import { customAlphabet } from 'nanoid';

import { Database } from '../database.js';
import { EpisodeModel } from '../entity/episodeModel.js';
import { ListItemModel } from '../entity/listModel.js';
import {
  externalIdColumnNames,
  ExternalIds,
  ItemType,
  itemTypes,
  MediaItemModel,
  mediaItemModelSchema,
  MediaType,
} from '../entity/mediaItemModel.js';
import { SeasonModel } from '../entity/seasonModel.js';
import { logger } from '../logger.js';
import { metadataProviders } from '../metadata/metadataProviders.js';
import { updateMetadata } from '../updateMetadata.js';
import { is, splitWhereInQuery, withDefinedPropertyFactory } from '../utils.js';
import {
  itemWithAtLeastOneExternalId,
  mediaItemRepository,
} from './mediaItemRepository.js';
import { seenEpisodesCountRepository } from './seenEpisodesCountRepository.js';
import { hasBeenSeenRepository } from './hasBeenSeenRepository.js';

type ImportEpisodeInfo = {
  episodeNumber: number;
  seasonNumber: number;
  tmdbId?: number | null;
  tvdb?: number | null;
  imdbId?: string | null;
};

type ImportSeasonInfo = {
  seasonNumber: number;
  tmdbId?: number | null;
  tvdb?: number | null;
  imdbId?: string | null;
};

export type ImportSeenHistoryItem = {
  itemType: 'episode' | Exclude<MediaType, 'tv'>;
  title?: string | null;
  releaseYear?: number | null;
  duration?: number | null;
  seenAt?: Date | null;
  episode?: ImportEpisodeInfo;
} & ExternalIds;

export type ImportRatingItem = {
  ratedAt?: Date | null;
  rating?: number | null;
  review?: string | null;
  itemType: ItemType;
  title?: string | null;
  releaseYear?: number | null;
  episode?: ImportEpisodeInfo;
  season?: ImportSeasonInfo;
} & ExternalIds;

export type ImportWatchlistItem = {
  addedAt?: Date | null;
  itemType: ItemType;
  title?: string | null;
  releaseYear?: number | null;
  episode?: ImportEpisodeInfo;
  season?: ImportSeasonInfo;
} & ExternalIds;

export type ImportListItem = {
  name: string;
  description?: string | null;
  createdAt?: Date | null;
  traktId?: number | null;
  items: Array<
    {
      addedAt?: Date | null;
      itemType: ItemType;
      title?: string | null;
      releaseYear?: number | null;
      episode?: ImportEpisodeInfo;
      season?: ImportSeasonInfo;
    } & ExternalIds
  >;
};

type ImportNumber = {
  total: number;
  found: number;
  notFound: ({
    title?: string;
    releaseYear?: number;
  } & ExternalIds)[];
};
export type ImportDetailsPerItemType = Record<ItemType, ImportNumber | null>;

export type ImportDetails = {
  seenHistory: ImportDetailsPerItemType;
  rating: ImportDetailsPerItemType;
  watchlist: ImportDetailsPerItemType;
  lists: {
    name: string;
    items: ImportDetailsPerItemType;
  }[];
};

export type ImportDataType = {
  seenHistory?: Array<ImportSeenHistoryItem>;
  ratings?: Array<ImportRatingItem>;
  watchlist?: Array<ImportWatchlistItem>;
  lists?: Array<ImportListItem>;
};

export type ImportState = {
  state:
    | 'parsing-input-file'
    | 'looking-in-local-database'
    | 'looking-in-external-providers'
    | 'updating-metadata'
    | 'importing'
    | 'imported';
  progress?: number;
  details?: ImportDetails;
};

type OnUpdateImportFunction = (args: ImportState) => void;

const itemTypeToMediaType = (itemType: ItemType): MediaType => {
  if (itemType === 'episode' || itemType === 'season') {
    return 'tv';
  }

  return itemType;
};

export const importRepository = {
  async importDataByExternalIds(args: {
    userId: number;
    importData: ImportDataType;
    onUpdate?: OnUpdateImportFunction;
  }) {
    const { userId, importData } = args;

    logger.debug(
      `importing data for user ${userId} (seenHistory: ${
        importData.seenHistory?.length
      }, rating: ${
        importData.ratings?.length
      }, watchlist: ${importData.watchlist?.length}, lists: ${
        importData.lists?.length || 0
      })`
    );

    const onUpdate: OnUpdateImportFunction = args.onUpdate
      ? args.onUpdate
      : () => {};

    const mediaItems = [
      ...(importData.seenHistory || []),
      ...(importData.ratings || []),
      ...(importData.watchlist || []),
      ...(importData.lists?.flatMap((list) => list.items) || []),
    ]
      .map((item) => ({
        ...item,
        needsDetails: item.episode || _.get(item, 'season'),
      }))
      .filter(itemWithAtLeastOneExternalId);

    onUpdate({ state: 'looking-in-local-database' });

    const existingMediaItems = await Database.knex.transaction(async (trx) => {
      return _.flatten(
        await Promise.all(
          _(externalIdColumnNames)
            .flatMap((columnName) =>
              _(mediaItems)
                .map((item) => _.get(item, columnName))
                .filter(is)
                .chunk(100)
                .map((ids) => trx('mediaItem').whereIn(columnName, ids))
                .value()
            )
            .value()
        )
      ).map((item) => mediaItemModelSchema.parse(item));
    });

    const findMediaItemFactory = () => {
      const maps = externalIdColumnNames
        .map((columnName) => ({
          columnName: columnName,
          map: _(existingMediaItems)
            .filter((item) => is(item[columnName]))
            .keyBy((item) => item[columnName]!)
            .value(),
        }))
        .map((item) => ({
          ...item,
          addMediaItem: (mediaItem: MediaItemModel) => {
            const id = mediaItem[item.columnName];

            if (id == undefined || id === null || item.map[id]) {
              return;
            }

            item.map[id] = mediaItem;
          },
        }));

      return {
        findMediaItem: (ids: ExternalIds) => {
          for (const item of maps) {
            const value = ids[item.columnName];

            if (is(value) && item.map[value]) {
              return item.map[value];
            }
          }
        },
        addNewMediaItem: (mediaItem: MediaItemModel) => {
          maps.forEach((item) => item.addMediaItem(mediaItem));
        },
      };
    };

    const { findMediaItem, addNewMediaItem } = findMediaItemFactory();

    const notFoundItems = _(mediaItems)
      .filter((item) => !findMediaItem(item))
      .uniqBy((item) => JSON.stringify(_.pick(item, externalIdColumnNames)))
      .value();

    const foundItems = [];

    if (notFoundItems.length > 0) {
      onUpdate({
        state: 'looking-in-external-providers',
        progress: 0,
      });

      let i = 0;

      for (const item of notFoundItems) {
        if (findMediaItem(item)) {
          foundItems.push(item);
        } else {
          const mediaType = itemTypeToMediaType(item.itemType);

          const res = await metadataProviders.searchByExternalId({
            mediaType: mediaType,
            ids: item,
          });

          if (res) {
            foundItems.push(res);
            addNewMediaItem(await mediaItemRepository.findOrCreate(res));
          }
        }

        onUpdate({
          state: 'looking-in-external-providers',
          progress: i++ / notFoundItems.length,
        });
      }
    }

    const itemsToUpdate = _(mediaItems)
      .filter(
        (item) => item.itemType === 'episode' || item.itemType === 'season'
      )
      .map(findMediaItem)
      .filter(is)
      .filter((item) => item.needsDetails === true)
      .uniqBy((item) => item.id)
      .value();

    for (const item of itemsToUpdate) {
      await updateMetadata(item);
    }

    const neededSeasonsEndEpisodes = _(mediaItems)
      .filter(
        (item) => item.itemType === 'episode' || item.itemType === 'season'
      )
      .map(findMediaItem)
      .filter(is)
      .map((item) => item.id)
      .uniq()
      .value();

    const seasons = await splitWhereInQuery(neededSeasonsEndEpisodes, (chunk) =>
      Database.knex('season').whereIn('tvShowId', chunk)
    );

    const episodes = await splitWhereInQuery(
      neededSeasonsEndEpisodes,
      (chunk) => Database.knex('episode').whereIn('tvShowId', chunk)
    );

    const episodeAndSeasonSearchFactory = () => {
      const seasonKey = (mediaItemId: number, seasonNumber: number) => {
        return [mediaItemId, seasonNumber].toString();
      };

      const episodeKey = (
        mediaItemId: number,
        seasonNumber: number,
        episodeNumber: number
      ) => {
        return [mediaItemId, seasonNumber, episodeNumber].toString();
      };

      const seasonByMediaItemIdAndSeasonNumber = _.keyBy(seasons, (season) =>
        seasonKey(season.tvShowId, season.seasonNumber)
      );

      const episodeByMediaItemIdAndSeasonNumber = _.keyBy(episodes, (episode) =>
        episodeKey(
          episode.tvShowId,
          episode.seasonNumber,
          episode.episodeNumber
        )
      );

      const findSeason = (
        mediaItem: MediaItemModel,
        season: ImportSeasonInfo
      ) => {
        return seasonByMediaItemIdAndSeasonNumber[
          seasonKey(mediaItem.id, season.seasonNumber)
        ];
      };

      const findEpisode = (
        mediaItem: MediaItemModel,
        episode: ImportEpisodeInfo
      ) => {
        return episodeByMediaItemIdAndSeasonNumber[
          episodeKey(mediaItem.id, episode.seasonNumber, episode.episodeNumber)
        ];
      };

      return {
        addEpisode: <
          T extends { mediaItem: MediaItemModel; episode?: ImportEpisodeInfo },
        >(
          item: T
        ): T & { episode?: EpisodeModel } => {
          return {
            ...item,
            episode: item.episode
              ? findEpisode(item.mediaItem, item.episode)
              : undefined,
          };
        },

        addSeason: <
          T extends { mediaItem: MediaItemModel; season?: ImportSeasonInfo },
        >(
          item: T
        ): T & { season?: SeasonModel } => {
          return {
            ...item,
            season: item.season
              ? findSeason(item.mediaItem, item.season)
              : undefined,
          };
        },
      };
    };

    const { addEpisode, addSeason } = episodeAndSeasonSearchFactory();

    const addMediaItem = <T extends ExternalIds>(
      item: T
    ): T & { mediaItem?: MediaItemModel } => {
      return {
        ...item,
        mediaItem: findMediaItem(item),
      };
    };

    const getSummary = <T extends ExternalIds & { itemType: ItemType }>(
      items: T[] | undefined,
      typesToExclude?: ItemType[]
    ): Record<string, ImportNumber | null> | null => {
      if (!items) {
        return null;
      }

      const res = itemTypes.map((itemType) => {
        const itemsWithCurrentMediaType = items
          .filter((item) => item.itemType === itemType)
          .map((item, index) => ({
            ...item,
            index,
          }));

        const foundItems =
          itemType === 'episode'
            ? itemsWithCurrentMediaType
                .map(addMediaItem)
                .filter(withMediaItem)
                .map(addEpisode)
                .filter(withEpisode)
            : itemType === 'season'
              ? itemsWithCurrentMediaType
                  .map(addMediaItem)
                  .filter(withMediaItem)
                  .map(addSeason)
                  .filter(withSeason)
              : itemsWithCurrentMediaType.filter(findMediaItem);

        const total = itemsWithCurrentMediaType.length;
        const found = foundItems.length;
        const notFound = _.differenceBy(
          itemsWithCurrentMediaType,
          foundItems,
          (item) => item.index
        ).map((item) => _.omit(item, 'index'));

        return {
          itemType,
          total,
          found,
          notFound,
        };
      });

      return _(res)
        .keyBy((item) => item.itemType)
        .mapValues((item) =>
          typesToExclude
            ? typesToExclude.includes(item.itemType)
              ? null
              : item
            : item
        )
        .mapValues((item) => (item ? _.omit(item, 'itemType') : item))
        .value();
    };

    const itemsToImport = {
      seenEntries: importData.seenHistory
        ?.map(addMediaItem)
        .filter(withMediaItem)
        .map(addEpisode)
        .filter(withEpisode)
        .map((item) => ({
          mediaItemId: item.mediaItem.id,
          userId: userId,
          date: item.seenAt?.getTime() || null,
          episodeId: item.episode ? item.episode.id : null,
          duration: item.duration,
        })),

      ratings: importData.ratings
        ?.map(addMediaItem)
        .filter(withMediaItem)
        .map(addEpisode)
        .filter(withEpisode)
        .map(addSeason)
        .filter(withSeason)
        .map((item) => ({
          userId: userId,
          mediaItemId: item.mediaItem.id,
          date: item.ratedAt?.getTime(),
          episodeId: item.episode ? item.episode.id : null,
          seasonId: item.season ? item.season.id : null,
          rating: item.rating,
          review: item.review || null,
        })),
      watchlistItems: importData.watchlist
        ?.map(addMediaItem)
        .filter(withMediaItem)
        .map(addEpisode)
        .filter(withEpisode)
        .map(addSeason)
        .filter(withSeason)
        .map((item) => ({
          mediaItemId: item.mediaItem.id,
          addedAt: item.addedAt?.getTime() || Date.now(),
          episodeId: item.episode ? item.episode.id : null,
          seasonId: item.season ? item.season.id : null,
        })),

      lists: importData.lists?.map((item) => ({
        name: item.name,
        description: item.description,
        userId: userId,
        traktId: item.traktId,
        items: item.items
          ?.map(addMediaItem)
          .filter(withMediaItem)
          .map(addEpisode)
          .filter(withEpisode)
          .map(addSeason)
          .filter(withSeason)
          .map((item) => ({
            mediaItemId: item.mediaItem.id,
            addedAt: item.addedAt?.getTime() || Date.now(),
            episodeId: item.episode ? item.episode.id : null,
            seasonId: item.season ? item.season.id : null,
          })),
      })),
    };

    onUpdate({ state: 'importing' });

    const uniqListName = uniqListNameFactory();

    await Database.knex.transaction(async (trx) => {
      const filterExistingItemsFactory = <T>(args: {
        uniqBy: (item: Partial<T>) => string | undefined;
        existingItems: Array<T>;
      }) => {
        const existingItemsSet = new Set(
          args.existingItems.map(args.uniqBy).filter(_.negate(_.isUndefined))
        );

        return (item: Partial<T>) => !existingItemsSet.has(args.uniqBy(item));
      };

      if (itemsToImport.seenEntries) {
        const filter = filterExistingItemsFactory({
          existingItems: await trx('seen').where('userId', userId),
          uniqBy: (item) => {
            return JSON.stringify([
              item.userId,
              item.mediaItemId,
              item.episodeId || null,
              item.date || null,
            ]);
          },
        });

        await trx.batchInsert(
          'seen',
          itemsToImport.seenEntries.filter(filter),
          30
        );

        await seenEpisodesCountRepository.recalculate({
          trx,
          mediaItemIds: itemsToImport.seenEntries
            .filter(filter)
            .filter((item) => typeof item.episodeId === 'number')
            .map((item) => item.mediaItemId),
          userId,
        });

        await hasBeenSeenRepository.recalculate({
          trx,
          mediaItemIds: itemsToImport.seenEntries
            .filter(filter)
            .filter((item) => typeof item.episodeId === 'number')
            .map((item) => item.mediaItemId),
          userId,
        });
      }

      if (itemsToImport.ratings) {
        const filter = filterExistingItemsFactory({
          existingItems: await trx('userRating').where('userId', userId),
          uniqBy: (item) => {
            return JSON.stringify([
              item.mediaItemId,
              item.episodeId || null,
              item.seasonId || null,
              item.userId,
            ]);
          },
        });

        await trx.batchInsert(
          'userRating',
          itemsToImport.ratings.filter(filter),
          30
        );
      }

      if (itemsToImport.watchlistItems || itemsToImport.lists) {
        const listItemUniqBy = (item: Partial<ListItemModel>) => {
          return JSON.stringify([
            item.mediaItemId,
            item.seasonId,
            item.episodeId,
          ]);
        };

        const existingLists = await trx('list').where('userId', userId);

        const existingListItems = await trx('listItem').whereIn(
          'listId',
          existingLists.map((item) => item.id)
        );

        if (itemsToImport.watchlistItems) {
          const watchlist = await trx('list')
            .where('userId', userId)
            .where('isWatchlist', true)
            .first();

          if (!watchlist) {
            throw new Error(`watchlist for user ${userId} does not exists`);
          }

          const filter = filterExistingItemsFactory({
            existingItems: existingListItems.filter(
              (item) => item.listId === watchlist.id
            ),
            uniqBy: listItemUniqBy,
          });

          await trx.batchInsert(
            'listItem',
            itemsToImport.watchlistItems.filter(filter).map((item) => ({
              ...item,
              listId: watchlist.id,
            })),
            30
          );
        }

        if (itemsToImport.lists) {
          const listByName = _.keyBy(existingLists, (item) => item.name);

          const listByTraktId = _.keyBy(existingLists, (item) =>
            item.traktId?.toString()
          );
          for (const list of itemsToImport.lists) {
            const listName = uniqListName(list.name);

            const existingList =
              listByName[listName] ||
              (list.traktId !== undefined && list.traktId !== null
                ? listByTraktId[list.traktId]
                : undefined);

            if (existingList) {
              if (list.items.length > 0) {
                const filter = filterExistingItemsFactory({
                  existingItems: existingListItems.filter(
                    (item) => item.listId === existingList.id
                  ),
                  uniqBy: listItemUniqBy,
                });

                await trx.batchInsert(
                  'listItem',
                  list.items.filter(filter).map((item) => ({
                    ...item,
                    listId: existingList.id,
                  })),
                  30
                );
              }
            } else {
              const createdAt = Date.now();
              const [insertedList] = await trx('list').insert(
                {
                  userId: userId,
                  name: listName,
                  // privacy: privacy || 'private',
                  privacy: 'private',
                  description: list.description,
                  // sortBy: sortBy || 'recently-watched',
                  sortBy: 'recently-watched',
                  sortOrder: 'desc',
                  // sortOrder: sortOrder || 'desc',
                  createdAt: createdAt,
                  updatedAt: createdAt,
                  isWatchlist: false,
                  traktId: list.traktId,
                },
                '*'
              );

              if (list.items.length > 0) {
                await trx.batchInsert(
                  'listItem',
                  list.items.map((item) => ({
                    ...item,
                    listId: insertedList.id,
                  })),
                  30
                );
              }
            }
          }
        }
      }
    });

    onUpdate({
      state: 'imported',
      progress: 1,
      details: {
        seenHistory: getSummary(importData.seenHistory),
        rating: getSummary(importData.ratings),
        watchlist: getSummary(importData.watchlist),
        lists: importData.lists
          ? importData.lists.map((list) => ({
              ...list,
              items: getSummary(list.items),
            }))
          : [],
      },
    });

    logger.debug(`import for user ${userId} completed`);
  },
} as const;

const withEpisode = <T extends { itemType: ItemType; episode?: EpisodeModel }>(
  item: T
) => {
  return item.itemType === 'episode' ? is(item.episode) : true;
};

const withSeason = <T extends { itemType: ItemType; season?: SeasonModel }>(
  item: T
) => {
  return item.itemType === 'season' ? is(item.season) : true;
};

const withMediaItem = withDefinedPropertyFactory('mediaItem');

const uniqListNameFactory = () => {
  const usedNamesSet = new Set<string>();
  const nameGenerator = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 12);

  return (name: string): string => {
    if (usedNamesSet.has(name)) {
      return `${name}-${nameGenerator()}`;
    }

    usedNamesSet.add(name);
    return name;
  };
};
