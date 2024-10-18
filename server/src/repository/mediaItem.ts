import _ from 'lodash';

import { omitUndefinedValues, repository } from 'src/repository/repository';
import { getItemsKnex, generateColumnNames } from 'src/knex/queries/items';
import { Database } from 'src/dbconfig';
import { getDetailsKnex } from 'src/knex/queries/details';
import { Seen } from 'src/entity/seen';
import { UserRating } from 'src/entity/userRating';
import { NotificationsHistory } from 'src/entity/notificationsHistory';
import { TvEpisode, tvEpisodeColumns } from 'src/entity/tvepisode';
import { tvSeasonRepository } from 'src/repository/season';
import { tvEpisodeRepository } from 'src/repository/episode';
import {
  ExternalIds,
  MediaItemBase,
  MediaItemBaseWithSeasons,
  mediaItemColumns,
  MediaItemForProvider,
  MediaItemItemsResponse,
  MediaType,
} from 'src/entity/mediaItem';
import { isValid, parseISO, subDays, subMinutes } from 'date-fns';
import { TvSeason } from 'src/entity/tvseason';
import { ListItem } from 'src/entity/list';
import { logger } from 'src/logger';
import { getImageId } from 'src/utils';

export type MediaItemOrderBy =
  | 'title'
  | 'lastSeen'
  | 'unseenEpisodes'
  | 'releaseDate'
  | 'nextAiring'
  | 'lastAiring'
  | 'status'
  | 'progress'
  | 'mediaType';
export type SortOrder = 'asc' | 'desc';

export type LastSeenAt = 'now' | 'release_date' | 'unknown' | 'custom_date';

export type Pagination<T> = {
  data: T[];
  page: number;
  totalPages: number;
  from: number;
  to: number;
  total: number;
};

export type GetItemsArgs = {
  userId: number;
  mediaType?: MediaType;
  orderBy?: MediaItemOrderBy;
  sortOrder?: SortOrder;
  /**
   * @description Return only items with title including this phrase
   */
  filter?: string;
  /**
   * @description Return only items on watchlist
   */
  onlyOnWatchlist?: boolean;
  /**
   * @description Return only seen items
   */
  onlySeenItems?: boolean;
  /**
   * @description
   */
  onlyWithNextEpisodesToWatch?: boolean;
  /**
   * @description Return only items with upcoming episode with release date, or unreleased other media with release date
   */

  onlyWithNextAiring?: boolean;
  /**
   * @description Return only items with user rating
   */
  onlyWithUserRating?: boolean;
  /**
   * @description Return only items without user rating
   */
  onlyWithoutUserRating?: boolean;

  onlyWithProgress?: boolean;

  page?: number;
  mediaItemIds?: number[];
};

class MediaItemRepository extends repository<MediaItemBase>({
  tableName: 'mediaItem',
  columnNames: mediaItemColumns,
  primaryColumnName: 'id',
  booleanColumnNames: ['needsDetails'],
}) {
  public items(
    args: GetItemsArgs & { page: number }
  ): Promise<Pagination<MediaItemItemsResponse>>;
  public items(
    args: Omit<GetItemsArgs, 'page'>
  ): Promise<MediaItemItemsResponse[]>;
  public items(args: never): Promise<unknown> {
    return getItemsKnex(args);
  }

  public async details(params: { mediaItemId: number; userId: number }) {
    return getDetailsKnex(params);
  }

  public deserialize(value: Partial<MediaItemBase>): MediaItemBase {
    return super.deserialize({
      ...value,
      genres: (value.genres as unknown as string)?.split(',') || null,
      narrators: (value.narrators as unknown as string)?.split(',') || null,
      authors: (value.authors as unknown as string)?.split(',') || null,
      platform: value.platform
        ? JSON.parse(value.platform as unknown as string)
        : null,
    });
  }

  public serialize(value: Partial<MediaItemBase>) {
    return super.serialize({
      ...value,
      genres: value.genres?.join(','),
      authors: value.authors?.join(','),
      narrators: value.narrators?.join(','),
      platform: value.platform ? JSON.stringify(value.platform) : null,
    } as unknown) as Record<string, unknown>;
  }

  public async delete(where?: { id: number }) {
    const mediaItemId = where.id;

    return await Database.knex.transaction(async (trx) => {
      await trx<NotificationsHistory>('notificationsHistory')
        .delete()
        .where('mediaItemId', mediaItemId);
      await trx<TvEpisode>('episode').delete().where('tvShowId', mediaItemId);
      await trx<TvSeason>('season').delete().where('tvShowId', mediaItemId);
      return await trx<MediaItemBase>(this.tableName)
        .delete()
        .where('id', mediaItemId);
    });
  }

  public async update(
    mediaItem: MediaItemBaseWithSeasons
  ): Promise<MediaItemBaseWithSeasons> {
    if (!mediaItem.id) {
      throw new Error('mediaItem.id filed is required');
    }

    if (!mediaItem.externalPosterUrl) {
      mediaItem.posterId = null;
    }

    if (!mediaItem.externalBackdropUrl) {
      mediaItem.backdropId = null;
    }

    return await Database.knex.transaction(async (trx) => {
      if (mediaItem.externalPosterUrl && !mediaItem.posterId) {
        mediaItem.posterId = getImageId();
      }

      if (mediaItem.externalBackdropUrl && !mediaItem.backdropId) {
        mediaItem.backdropId = getImageId();
      }

      const result = {
        ..._.cloneDeep(mediaItem),
        lastTimeUpdated: mediaItem.lastTimeUpdated
          ? mediaItem.lastTimeUpdated
          : new Date().getTime(),
      };

      await trx(this.tableName)
        .update(this.serialize(this.stripValue(mediaItem)))
        .where({
          id: mediaItem.id,
        });

      if (result.seasons) {
        await Promise.all(
          result.seasons.map(async (season) => {
            let updated = false;

            season.numberOfEpisodes =
              season.numberOfEpisodes || season.episodes?.length || 0;
            season.tvShowId = mediaItem.id;

            if (!season.externalPosterUrl) {
              season.posterId = null;
            }

            if (season.externalPosterUrl && !season.posterId) {
              season.posterId = getImageId();
            }

            const newSeason = omitUndefinedValues(
              tvSeasonRepository.stripValue(
                tvSeasonRepository.serialize(season)
              )
            );

            if (season.id) {
              const res = await trx('season')
                .update(newSeason)
                .where({ id: season.id });

              updated = res === 1;
            }

            if (!updated) {
              season.id = (
                await trx('season').insert(newSeason).returning('id')
              ).at(0).id;
            }

            if (season.episodes) {
              for (const episode of season.episodes) {
                let updated = false;

                episode.seasonAndEpisodeNumber =
                  episode.seasonNumber * 1000 + episode.episodeNumber;
                episode.seasonId = season.id;
                episode.tvShowId = mediaItem.id;

                const newEpisode = omitUndefinedValues(
                  tvEpisodeRepository.stripValue(
                    tvEpisodeRepository.serialize(episode)
                  )
                );

                if (episode.id) {
                  const res = await trx<TvEpisode>('episode')
                    .update(newEpisode)
                    .where({ id: episode.id });

                  updated = res === 1;
                }
                if (!updated) {
                  episode.id = (
                    await trx('episode').insert(newEpisode).returning('id')
                  ).at(0).id;
                }
              }
            }
          })
        );
      }

      return result;
    });
  }

  public async create(mediaItem: MediaItemBaseWithSeasons) {
    if (mediaItem.releaseDate && !isValid(parseISO(mediaItem.releaseDate))) {
      logger.error(`Invalid date format for ${mediaItem.id}`);
      mediaItem.releaseDate = undefined;
    }

    if (mediaItem.externalPosterUrl) {
      mediaItem.posterId = getImageId();
    }

    if (mediaItem.externalBackdropUrl) {
      mediaItem.backdropId = getImageId();
    }

    return await Database.knex.transaction(async (trx) => {
      const result = {
        ..._.cloneDeep(mediaItem),
        lastTimeUpdated: mediaItem.lastTimeUpdated
          ? mediaItem.lastTimeUpdated
          : new Date().getTime(),
      };

      const res = await trx(this.tableName)
        .insert(this.serialize(omitUndefinedValues(this.stripValue(mediaItem))))
        .returning(this.primaryColumnName);

      result.id = res.at(0)[this.primaryColumnName];

      result.seasons = result.seasons?.map((season) => ({
        ...season,
        numberOfEpisodes:
          season.numberOfEpisodes || season.episodes?.length || 0,
        tvShowId: result.id,
        posterId: season.externalPosterUrl ? getImageId() : null,
      }));

      result.seasons?.forEach((season) => {
        if (season.releaseDate && !isValid(parseISO(season.releaseDate))) {
          logger.error(`Invalid date format for season ${season.id}`);
          season.releaseDate = undefined;
        }
      });

      if (result.seasons?.length > 0) {
        const seasonsId = await Database.knex
          .batchInsert(
            'season',
            result.seasons.map((season) => _.omit(season, 'episodes')),
            30
          )
          .transacting(trx)
          .returning('id');

        result.seasons = _.merge(result.seasons, seasonsId);

        for (const season of result.seasons) {
          if (season.episodes?.length > 0) {
            season.episodes = season.episodes?.map((episode) => ({
              ...episode,
              tvShowId: result.id,
              seasonId: season.id,
              seasonAndEpisodeNumber:
                episode.seasonNumber * 1000 + episode.episodeNumber,
            }));

            season.episodes?.forEach((episode) => {
              if (
                episode.releaseDate &&
                !isValid(parseISO(episode.releaseDate))
              ) {
                logger.error(`Invalid date format for episode ${episode.id}`);
                episode.releaseDate = undefined;
              }
            });

            const episodesId = await Database.knex
              .batchInsert('episode', season.episodes, 30)
              .transacting(trx)
              .returning('id');

            season.episodes = _.merge(season.episodes, episodesId);
          }
        }
      }

      return result;
    });
  }

  public async createMany(mediaItem: MediaItemBaseWithSeasons[]) {
    return await Promise.all(
      mediaItem.map((mediaItem) => this.create(mediaItem))
    );
  }

  public async seasonsWithEpisodes(mediaItem: MediaItemBase) {
    const seasons = await tvSeasonRepository.find({
      tvShowId: Number(mediaItem.id),
    });

    const episodes = await tvEpisodeRepository.find({
      tvShowId: Number(mediaItem.id),
    });

    const groupedEpisodes = _.groupBy(episodes, (episode) => episode.seasonId);

    seasons.forEach((season) => (season.episodes = groupedEpisodes[season.id]));

    return seasons;
  }

  public async findByExternalIds(params: {
    tmdbId?: number[];
    imdbId?: string[];
    tvmazeId?: number[];
    igdbId?: number[];
    openlibraryId?: number[];
    audibleId?: string[];
    goodreadsId?: number[];
    traktId?: number[];
    tvdbId?: number[];
    mediaType: MediaType;
  }) {
    const totalNumberOfIds = externalIdColumnNames.reduce(
      (sum, id) => sum + params[id]?.length,
      0
    );

    if (totalNumberOfIds < 100) {
      return (
        await Database.knex<MediaItemBase>(this.tableName)
          .where({ mediaType: params.mediaType })
          .andWhere((qb) => {
            externalIdColumnNames.forEach((id) => {
              if (params[id]?.length > 0) {
                qb.orWhereIn(id, params[id]);
              }
            });
          })
      ).map((item) => this.deserialize(item));
    }

    const splittedExternalIds = externalIdColumnNames
      .flatMap((id) =>
        params[id]
          ? _.chunk(params[id] as (string | number)[], 100).map((values) => ({
              columnName: id,
              values: values,
            }))
          : undefined
      )
      .filter(Boolean);

    return (
      await Database.knex.transaction(async (trx) => {
        return _.flatten(
          await Promise.all(
            splittedExternalIds.map(
              async (item) =>
                await trx<MediaItemBase>(this.tableName)
                  .where({
                    mediaType: params.mediaType,
                  })
                  .whereIn(item.columnName, item.values)
            )
          )
        );
      })
    ).map((item) => this.deserialize(item));
  }

  public async findByExternalId(params: ExternalIds, mediaType: MediaType) {
    const res = await Database.knex<MediaItemBase>(this.tableName)
      .where({ mediaType: mediaType })
      .andWhere((qb) => {
        if (params.tmdbId) {
          qb.orWhere('tmdbId', params.tmdbId);
        }
        if (params.imdbId) {
          qb.orWhere('imdbId', params.imdbId);
        }
        if (params.tvmazeId) {
          qb.orWhere('tvmazeId', params.tvmazeId);
        }
        if (params.igdbId) {
          qb.orWhere('igdbId', params.igdbId);
        }
        if (params.openlibraryId) {
          qb.orWhere('openlibraryId', params.openlibraryId);
        }
        if (params.audibleId) {
          qb.orWhere('audibleId', params.audibleId);
        }
        if (params.goodreadsId) {
          qb.orWhere('goodreadsId', params.goodreadsId);
        }
        if (params.traktId) {
          qb.orWhere('traktId', params.traktId);
        }

        if (params.tvdbId) {
          qb.orWhere('tvdbId', params.tvdbId);
        }
      })
      .first();

    if (res) {
      return this.deserialize(res);
    }
  }
    
  public async findByTitle(params: {
    mediaType: MediaType;
    title: string;
    releaseYear?: number;
  }): Promise<MediaItemBase> {
    if (typeof params.title !== 'string') {
      return;
    }

    const qb = Database.knex<MediaItemBase>(this.tableName)
      .select(
        '*',
        Database.knex.raw(`LENGTH(title) - ${params.title.length} AS rank`)
      )
      .where('mediaType', params.mediaType)
      .where((qb) =>
        qb
          .where('title', 'LIKE', `%${params.title}%`)
          .orWhere('originalTitle', 'LIKE', `%${params.title}%`)
      )
      .orderBy('rank', 'asc');

    if (params.releaseYear) {
      qb.whereBetween('releaseDate', [
        new Date(params.releaseYear, 0, 1).toISOString(),
        new Date(params.releaseYear, 11, 31).toISOString(),
      ]);
    }

    return this.deserialize(await qb.first());
  }

  public async findByExactTitle(params: {
    mediaType: MediaType;
    title: string;
    releaseYear?: number;
  }): Promise<MediaItemBase> {
    if (typeof params.title !== 'string') {
      return;
    }

    const qb = Database.knex<MediaItemBase>(this.tableName)
      .where('mediaType', params.mediaType)
      .where((qb) =>
        qb
          .where('title', 'LIKE', params.title)
          .orWhere('originalTitle', 'LIKE', params.title)
      );

    if (params.releaseYear) {
      qb.whereBetween('releaseDate', [
        new Date(params.releaseYear, 0, 1).toISOString(),
        new Date(params.releaseYear, 11, 31).toISOString(),
      ]);
    }

    const res = await qb.first();

    if (res) {
      return this.deserialize(res);
    }
  }

  public async itemsToPossiblyUpdate(): Promise<MediaItemBase[]> {
    return await Database.knex<MediaItemBase>('mediaItem')
      .select('mediaItem.*')
      .leftJoin<Seen>('seen', 'seen.mediaItemId', 'mediaItem.id')
      .leftJoin<ListItem>('listItem', 'listItem.mediaItemId', 'mediaItem.id')
      .leftJoin<UserRating>(
        'userRating',
        'userRating.mediaItemId',
        'mediaItem.id'
      )
      .where((q) =>
        q
          .whereNotNull('seen.id')
          .orWhereNotNull('listItem.id')
          .orWhereNotNull('userRating.id')
      )
      .whereNot('source', 'user')
      .whereNot('source', 'goodreads')
      .groupBy('mediaItem.id');
  }

  public async itemsToNotify(from: Date, to: Date): Promise<MediaItemBase[]> {
    const res: MediaItemBase[] = await Database.knex<MediaItemBase>(
      this.tableName
    )
      .select('mediaItem.*')
      .select('notificationsHistory.mediaItemId')
      .select('notificationsHistory.id AS notificationsHistory.id')
      .leftJoin<NotificationsHistory>(
        'notificationsHistory',
        'notificationsHistory.mediaItemId',
        'mediaItem.id'
      )
      .where((qb) =>
        qb
          .whereBetween('mediaItem.releaseDate', [
            from.toISOString(),
            to.toISOString(),
          ])
          .orWhereBetween('mediaItem.releaseDate', [
            subMinutes(from, new Date().getTimezoneOffset()).toISOString(),
            subMinutes(to, new Date().getTimezoneOffset()).toISOString(),
          ])
      )
      .whereNot('mediaType', 'tv')
      .whereNull('notificationsHistory.id');

    return _(res)
      .uniqBy('id')
      .filter((item) => {
        const releaseDate = parseISO(item.releaseDate);
        return releaseDate > from && releaseDate < to;
      })
      .value();
  }

  public async episodesToNotify(from: Date, to: Date) {
    const res = await Database.knex<TvEpisode>('episode')
      .select(generateColumnNames('episode', tvEpisodeColumns))
      .select(generateColumnNames('mediaItem', mediaItemColumns))
      .select('notificationsHistory.mediaItemId')
      .select('notificationsHistory.id AS notificationsHistory.id')
      .leftJoin<NotificationsHistory>(
        'notificationsHistory',
        'notificationsHistory.episodeId',
        'episode.id'
      )
      .leftJoin<MediaItemBase>('mediaItem', 'mediaItem.id', 'episode.tvShowId')
      .where((qb) =>
        qb
          .whereBetween('episode.releaseDate', [
            from.toISOString(),
            to.toISOString(),
          ])
          .orWhereBetween('episode.releaseDate', [
            subMinutes(from, new Date().getTimezoneOffset()).toISOString(),
            subMinutes(to, new Date().getTimezoneOffset()).toISOString(),
          ])
      )
      .where('episode.isSpecialEpisode', false)
      .whereNull('notificationsHistory.id');

    return _(res)
      .uniqBy('episode.id')
      .filter((item) => {
        const releaseDate = parseISO(item['episode.releaseDate']);
        return releaseDate > from && releaseDate < to;
      })
      .map((row) =>
        _(row)
          .pickBy((value, column) => column.startsWith('episode.'))
          .mapKeys((value, key) => key.substring('episode.'.length))
          .set(
            'tvShow',
            _(row)
              .pickBy((value, column) => column.startsWith('mediaItem.'))
              .mapKeys((value, key) => key.substring('mediaItem.'.length))
              .value()
          )
          .value()
      )
      .value() as (TvEpisode & { tvShow: MediaItemBase })[];
  }

  public async lock(mediaItemId: number) {
    const res = await Database.knex<MediaItemBase>(this.tableName)
      .update({ lockedAt: new Date().getTime() })
      .where('id', mediaItemId)
      .where('lockedAt', null);

    if (res === 0) {
      throw new Error(`MediaItem ${mediaItemId} is locked`);
    }
  }

  public async unlock(mediaItemId: number) {
    await Database.knex<MediaItemBase>(this.tableName)
      .update({ lockedAt: null })
      .where('id', mediaItemId);
  }

  public async mergeSearchResultWithExistingItems(
    searchResult: MediaItemForProvider[],
    mediaType: MediaType
  ) {
    return await Promise.all(
      searchResult
        .filter(
          (item) =>
            externalIdColumnNames
              .map((columnName) => item[columnName])
              .filter(Boolean).length > 0
        )
        .map(async (item) => {
          return await Database.knex.transaction(async (trx) => {
            const existingItem = await trx<MediaItemBase>('mediaItem')
              .where({ mediaType: mediaType })
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

            const [res] = await trx<MediaItemBase>('mediaItem')
              .insert({
                ...this.serialize(omitUndefinedValues(this.stripValue(item))),
                posterId: item.externalPosterUrl ? getImageId() : null,
                backdropId: item.externalBackdropUrl ? getImageId() : null,
                lastTimeUpdated: Date.now(),
              })
              .returning('*');

            return res;
          });
        })
    );
  }

  public async unlockLockedMediaItems() {
    return await Database.knex<MediaItemBase>(this.tableName)
      .update('lockedAt', null)
      .where('lockedAt', '<=', subDays(new Date(), 1).getTime());
  }
}

export const mediaItemRepository = new MediaItemRepository();

const externalIdColumnNames = <const>[
  'openlibraryId',
  'imdbId',
  'tmdbId',
  'igdbId',
  'tvmazeId',
  'audibleId',
  'traktId',
  'goodreadsId',
  'tvdbId',
];

const groupByExternalId = <T extends MediaItemForProvider>(items: T[]) => {
  return _(externalIdColumnNames)
    .keyBy()
    .mapValues((externalIdColumnName) =>
      _(items)
        .filter((item) => Boolean(item[externalIdColumnName]))
        .groupBy(externalIdColumnName)
        .value()
    )
    .value();
};
