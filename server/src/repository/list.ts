import { Knex } from 'knex';
import { Database } from 'src/dbconfig';
import { Image } from 'src/entity/image';
import {
  List,
  ListItem,
  ListPrivacy,
  ListSortBy,
  ListSortOrder,
} from 'src/entity/list';
import { MediaItemItemsResponse, MediaType } from 'src/entity/mediaItem';
import { Seen } from 'src/entity/seen';
import { TvEpisode } from 'src/entity/tvepisode';
import { TvSeason } from 'src/entity/tvseason';
import { UserRating } from 'src/entity/userRating';
import { repository } from 'src/repository/repository';
import { randomSlugId, toSlug } from 'src/slug';

export type ListDetailsResponse = Omit<List, 'userId'> & {
  totalRuntime: number;
  user: {
    id: number;
    username: string;
    slug: string;
  };
};

export type ListItemsResponse = {
  rank: number;
  id: number;
  listedAt: string;
  type: MediaType | 'season' | 'episode';
  mediaItem: MediaItemItemsResponse;
  season?: TvSeason & {
    lastSeenAt?: string;
  };
  episode?: TvEpisode;
}[];

class ListRepository extends repository<List>({
  tableName: 'list',
  primaryColumnName: 'id',
}) {
  public async update(args: {
    name: string;
    description?: string;
    privacy?: ListPrivacy;
    sortBy?: ListSortBy;
    sortOrder?: ListSortOrder;
    id: number;
    userId: number;
  }): Promise<List> {
    const { userId, name, description, privacy, sortBy, sortOrder, id } = args;

    if (id == undefined || userId == undefined) {
      throw new Error('id and userId are required params');
    }

    if (name?.trim().length === 0) {
      return;
    }

    const updatedAt = new Date().getTime();
    const slug = toSlug(name);

    return await Database.knex.transaction(async (trx) => {
      const list = await trx<List>('list').where('id', id).first();

      if (!list) {
        return;
      }

      if (list.userId !== userId) {
        return;
      }

      const listWithTheSameName = await trx<List>('list')
        .where('userId', userId)
        .where('name', name)
        .whereNot('id', id)
        .first();

      if (listWithTheSameName) {
        return;
      }

      await trx<List>('list')
        .update({
          ...(list.isWatchlist ? {} : { name: name }),
          privacy: privacy,
          description: description,
          updatedAt: updatedAt,
          sortBy: sortBy,
          sortOrder: sortOrder,
          // displayNumbers: args.displayNumbers || false,
          // allowComments: args.allowComments || false,
          slug: Database.knex.raw(
            `(CASE WHEN (${Database.knex<List>('list')
              .count()
              .where('userId', userId)
              .where('slug', slug)
              .whereNot('id', id)
              .toQuery()}) = 0  THEN '${slug}' ELSE '${slug}-${randomSlugId()}' END)`
          ),
        })
        .where('id', id);

      return await trx<List>('list').where('id', id).first();
    });
  }

  public async create(args: {
    name: string;
    description?: string;
    privacy?: ListPrivacy;
    sortBy?: ListSortBy;
    sortOrder?: ListSortOrder;
    userId: number;
    isWatchlist?: boolean;
  }): Promise<List> {
    const {
      userId,
      name,
      description,
      privacy,
      sortBy,
      sortOrder,
      isWatchlist,
    } = args;

    if (name.trim().length === 0) {
      return;
    }

    const createdAt = new Date().getTime();
    const slug = toSlug(name);

    const [res] = await Database.knex<List>('list').insert(
      {
        userId: userId,
        name: name,
        privacy: privacy || 'private',
        description: description,
        sortBy: sortBy || 'recently-watched',
        sortOrder: sortOrder || 'desc',
        createdAt: createdAt,
        updatedAt: createdAt,
        isWatchlist: isWatchlist || false,
        rank: Database.knex.raw(
          `(${Database.knex<List>('list')
            .count()
            .where('userId', args.userId)
            .toQuery()})`
        ),
        slug: Database.knex.raw(
          `(CASE WHEN (${Database.knex<List>('list')
            .count()
            .where('userId', args.userId)
            .where('slug', slug)
            .toQuery()}) = 0  THEN '${slug}' ELSE '${slug}-${randomSlugId()}' END)`
        ),
      },
      '*'
    );

    return {
      ...res,
      displayNumbers: Boolean(res.displayNumbers),
      allowComments: Boolean(res.allowComments),
    };
  }

  public async delete(args: {
    listId: number;
    userId: number;
  }): Promise<number> {
    const { listId, userId } = args;

    return await Database.knex.transaction(async (trx) => {
      const list = await trx<List>('list')
        .where('userId', userId)
        .where('id', listId)
        .where('isWatchlist', false)
        .first();

      if (!list) {
        return 0;
      }

      await trx<ListItem>('listItem').delete().where('listId', listId);
      return await trx<ListItem>('list').delete().where('id', listId);
    });
  }

  public async details(args: {
    listId: number;
    userId: number;
  }): Promise<ListDetailsResponse> {
    const { listId, userId } = args;

    const res = await Database.knex('list')
      .select(
        'list.*',
        'totalRuntime',
        'user.name AS user.name',
        'user.slug AS user.slug'
      )
      .where('list.id', listId)
      .where((qb) =>
        qb.where('list.userId', userId).orWhere('list.privacy', 'public')
      )
      .leftJoin(
        (qb) =>
          qb
            .leftJoin('listItem', 'listItem.listId', 'list.id')
            .leftJoin('mediaItem', 'mediaItem.id', 'listItem.mediaItemId')
            .leftJoin('episode', 'episode.id', 'listItem.episodeId')
            .leftJoin(
              (qb) =>
                qb
                  .select('seasonId')
                  .sum({
                    runtime: Database.knex.raw(`
                CASE
                  WHEN "episode"."runtime" IS NOT NULL THEN "episode"."runtime"
                  ELSE "mediaItem"."runtime"
                END`),
                  })
                  .from('season')
                  .leftJoin('mediaItem', 'mediaItem.id', 'season.tvShowId')
                  .leftJoin('episode', 'episode.seasonId', 'season.id')
                  .groupBy('seasonId')
                  .as('seasonRuntime'),
              'seasonRuntime.seasonId',
              'listItem.seasonId'
            )
            .leftJoin(
              (qb) =>
                qb
                  .select('tvShowId')
                  .sum({
                    runtime: Database.knex.raw(`
                CASE
                  WHEN "episode"."runtime" IS NOT NULL THEN "episode"."runtime"
                  ELSE "mediaItem"."runtime"
                END`),
                  })
                  .from('episode')
                  .leftJoin('mediaItem', 'mediaItem.id', 'episode.tvShowId')
                  .groupBy('tvShowId')
                  .as('showRuntime'),
              'showRuntime.tvShowId',
              'listItem.mediaItemId'
            )
            .sum({
              totalRuntime: Database.knex.raw(`
                CASE
                    WHEN "listItem"."episodeId" IS NOT NULL THEN CASE
                        WHEN "episode"."runtime" IS NOT NULL THEN "episode"."runtime"
                        ELSE "mediaItem"."runtime"
                    END
                    WHEN "listItem"."seasonId" IS NOT NULL THEN "seasonRuntime"."runtime"
                    ELSE CASE
                        WHEN "mediaItem"."mediaType" = 'tv' THEN "showRuntime"."runtime"
                        ELSE "mediaItem"."runtime"
                    END
                END`),
            })
            .where('list.id', listId)
            .from('list'),
        '',
        ''
      )
      .leftJoin('user', 'user.id', 'list.userId')
      .first();

    if (!res) {
      return;
    }

    return {
      id: res.id,
      createdAt: res.createdAt,
      isWatchlist: Boolean(res.isWatchlist),
      allowComments: Boolean(res.allowComments),
      displayNumbers: Boolean(res.displayNumbers),
      name: res.name,
      privacy: res.privacy,
      slug: res.slug,
      totalRuntime: res.totalRuntime,
      updatedAt: res.updatedAt,
      description: res.description,
      sortBy: res.sortBy,
      sortOrder: res.sortOrder,
      user: {
        id: res.userId,
        username: res['user.name'],
        slug: res['user.slug'],
      },
    };
  }

  public async items(args: {
    listId: number;
    userId: number;
  }): Promise<ListItemsResponse> {
    const { listId, userId } = args;

    const { id: watchlistId } = await Database.knex('list')
      .select('id')
      .where('userId', userId)
      .where('isWatchlist', true)
      .first();

    const currentDateString = new Date().toISOString();

    const res = await Database.knex<ListItem>('listItem')
      .select({
        'episode.episodeNumber': 'episode.episodeNumber',
        'episode.imdbId': 'episode.imdbId',
        'episode.isSpecialEpisode': 'episode.isSpecialEpisode',
        'episode.lastSeenAt': 'episodeLastSeen.lastSeenAt',
        'episode.releaseDate': 'episode.releaseDate',
        'episode.progress': 'episodeProgress.progress',
        'episode.seasonNumber': 'episode.seasonNumber',
        'episode.seasonAndEpisodeNumber': 'episode.seasonAndEpisodeNumber',
        'episode.title': 'episode.title',
        'episode.runtime': 'episode.runtime',
        'episode.tmdbId': 'episode.tmdbId',
        'episode.traktId': 'episode.traktId',
        'episode.tvdbId': 'episode.tvdbId',
        'episode.userRating.date': 'episodeRating.date',
        'episode.userRating.rating': 'episodeRating.rating',
        'episode.watchlist.id': 'episodeWatchlist.id',
        'listItem.addedAt': 'listItem.addedAt',
        'listItem.episodeId': 'listItem.episodeId',
        'listItem.id': 'listItem.id',
        'listItem.mediaItemId': 'listItem.mediaItemId',
        'listItem.rank': 'listItem.rank',
        'listItem.seasonId': 'listItem.seasonId',
        'mediaItem.airedEpisodesCount': 'mediaItemAiredEpisodes.count',
        'mediaItem.backdrop.id': 'mediaItemBackdrop.id',
        'mediaItem.firstUnwatchedEpisode.description':
          'mediaItemFirstUnwatchedEpisode.description',
        'mediaItem.firstUnwatchedEpisode.episodeNumber':
          'mediaItemFirstUnwatchedEpisode.episodeNumber',
        'mediaItem.firstUnwatchedEpisode.id':
          'mediaItemFirstUnwatchedEpisode.id',
        'mediaItem.firstUnwatchedEpisode.imdbId':
          'mediaItemFirstUnwatchedEpisode.imdbId',
        'mediaItem.firstUnwatchedEpisode.isSpecialEpisode':
          'mediaItemFirstUnwatchedEpisode.isSpecialEpisode',
        'mediaItem.firstUnwatchedEpisode.releaseDate':
          'mediaItemFirstUnwatchedEpisode.releaseDate',
        'mediaItem.firstUnwatchedEpisode.runtime':
          'mediaItemFirstUnwatchedEpisode.runtime',
        'mediaItem.firstUnwatchedEpisode.seasonId':
          'mediaItemFirstUnwatchedEpisode.seasonId',
        'mediaItem.firstUnwatchedEpisode.seasonNumber':
          'mediaItemFirstUnwatchedEpisode.seasonNumber',
        'mediaItem.firstUnwatchedEpisode.title':
          'mediaItemFirstUnwatchedEpisode.title',
        'mediaItem.firstUnwatchedEpisode.tmdbId':
          'mediaItemFirstUnwatchedEpisode.tmdbId',
        'mediaItem.firstUnwatchedEpisode.traktId':
          'mediaItemFirstUnwatchedEpisode.traktId',
        'mediaItem.firstUnwatchedEpisode.tvdbId':
          'mediaItemFirstUnwatchedEpisode.tvdbId',
        'mediaItem.firstUnwatchedEpisode.tvShowId':
          'mediaItemFirstUnwatchedEpisode.tvShowId',
        'mediaItem.lastAiredEpisode.id': 'mediaItemLastAiredEpisode.id',
        'mediaItem.lastAiredEpisode.description':
          'mediaItemLastAiredEpisode.description',
        'mediaItem.lastAiredEpisode.episodeNumber':
          'mediaItemLastAiredEpisode.episodeNumber',
        'mediaItem.lastAiredEpisode.imdbId': 'mediaItemLastAiredEpisode.imdbId',
        'mediaItem.lastAiredEpisode.isSpecialEpisode':
          'mediaItemLastAiredEpisode.isSpecialEpisode',
        'mediaItem.lastAiredEpisode.releaseDate':
          'mediaItemLastAiredEpisode.releaseDate',
        'mediaItem.lastAiredEpisode.runtime':
          'mediaItemLastAiredEpisode.runtime',
        'mediaItem.lastAiredEpisode.seasonId':
          'mediaItemLastAiredEpisode.seasonId',
        'mediaItem.lastAiredEpisode.seasonNumber':
          'mediaItemLastAiredEpisode.seasonNumber',
        'mediaItem.lastAiredEpisode.title': 'mediaItemLastAiredEpisode.title',
        'mediaItem.lastAiredEpisode.tmdbId': 'mediaItemLastAiredEpisode.tmdbId',
        'mediaItem.lastAiredEpisode.traktId':
          'mediaItemLastAiredEpisode.traktId',
        'mediaItem.lastAiredEpisode.tvdbId': 'mediaItemLastAiredEpisode.tvdbId',

        'mediaItem.upcomingEpisode.id': 'mediaItemUpcomingEpisode.id',
        'mediaItem.upcomingEpisode.description':
          'mediaItemUpcomingEpisode.description',
        'mediaItem.upcomingEpisode.episodeNumber':
          'mediaItemUpcomingEpisode.episodeNumber',
        'mediaItem.upcomingEpisode.imdbId': 'mediaItemUpcomingEpisode.imdbId',
        'mediaItem.upcomingEpisode.isSpecialEpisode':
          'mediaItemUpcomingEpisode.isSpecialEpisode',
        'mediaItem.upcomingEpisode.releaseDate':
          'mediaItemUpcomingEpisode.releaseDate',
        'mediaItem.upcomingEpisode.runtime': 'mediaItemUpcomingEpisode.runtime',
        'mediaItem.upcomingEpisode.seasonId':
          'mediaItemUpcomingEpisode.seasonId',
        'mediaItem.upcomingEpisode.seasonNumber':
          'mediaItemUpcomingEpisode.seasonNumber',
        'mediaItem.upcomingEpisode.title': 'mediaItemUpcomingEpisode.title',
        'mediaItem.upcomingEpisode.tmdbId': 'mediaItemUpcomingEpisode.tmdbId',
        'mediaItem.upcomingEpisode.traktId': 'mediaItemUpcomingEpisode.traktId',
        'mediaItem.upcomingEpisode.tvdbId': 'mediaItemUpcomingEpisode.tvdbId',

        'mediaItem.genres': 'mediaItem.genres',
        'mediaItem.id': 'mediaItem.id',
        'mediaItem.imdbId': 'mediaItem.imdbId',
        'mediaItem.lastSeenAt': 'mediaItemLastSeen.lastSeenAt',
        'mediaItem.lastSeen.mediaItemId': 'mediaItemLastSeen.mediaItemId',
        'mediaItem.lastTimeUpdated': 'mediaItem.lastTimeUpdated',
        'mediaItem.mediaType': 'mediaItem.mediaType',
        'mediaItem.network': 'mediaItem.network',
        'mediaItem.overview': 'mediaItem.overview',
        'mediaItem.poster.id': 'mediaItemPoster.id',
        'mediaItem.progress': 'mediaItemProgress.progress',
        'mediaItem.releaseDate': 'mediaItem.releaseDate',
        'mediaItem.runtime': 'mediaItem.runtime',
        'mediaItem.seenEpisodesCount':
          'mediaItemSeenEpisodes.seenEpisodesCount',
        'mediaItem.slug': 'mediaItem.slug',
        'mediaItem.status': 'mediaItem.status',
        'mediaItem.source': 'mediaItem.source',
        'mediaItem.title': 'mediaItem.title',
        'mediaItem.tmdbId': 'mediaItem.tmdbId',
        'mediaItem.totalRuntime': 'mediaItemTotalRuntime.totalRuntime',
        'mediaItem.traktId': 'mediaItem.traktId',
        'mediaItem.tvdbId': 'mediaItem.tvdbId',
        'mediaItem.url': 'mediaItem.url',
        'mediaItem.userRating.date': 'mediaItemRating.date',
        'mediaItem.userRating.rating': 'mediaItemRating.rating',
        'mediaItem.watchlist.id': 'mediaItemWatchlist.id',
        'season.airedEpisodesCount': 'seasonAiredEpisodes.count',
        'season.firstUnwatchedEpisode.description':
          'seasonFirstUnwatchedEpisode.description',
        'season.firstUnwatchedEpisode.episodeNumber':
          'seasonFirstUnwatchedEpisode.episodeNumber',
        'season.firstUnwatchedEpisode.id': 'seasonFirstUnwatchedEpisode.id',
        'season.firstUnwatchedEpisode.imdbId':
          'seasonFirstUnwatchedEpisode.imdbId',
        'season.firstUnwatchedEpisode.isSpecialEpisode':
          'seasonFirstUnwatchedEpisode.isSpecialEpisode',
        'season.firstUnwatchedEpisode.releaseDate':
          'seasonFirstUnwatchedEpisode.releaseDate',
        'season.firstUnwatchedEpisode.runtime':
          'seasonFirstUnwatchedEpisode.runtime',
        'season.firstUnwatchedEpisode.seasonId':
          'seasonFirstUnwatchedEpisode.seasonId',
        'season.firstUnwatchedEpisode.seasonNumber':
          'seasonFirstUnwatchedEpisode.seasonNumber',
        'season.firstUnwatchedEpisode.title':
          'seasonFirstUnwatchedEpisode.title',
        'season.firstUnwatchedEpisode.tmdbId':
          'seasonFirstUnwatchedEpisode.tmdbId',
        'season.firstUnwatchedEpisode.traktId':
          'seasonFirstUnwatchedEpisode.traktId',
        'season.firstUnwatchedEpisode.tvdbId':
          'seasonFirstUnwatchedEpisode.tvdbId',
        'season.firstUnwatchedEpisode.tvShowId':
          'seasonFirstUnwatchedEpisode.tvShowId',
        'season.lastAiredEpisode.id': 'seasonLastAiredEpisode.id',
        'season.lastAiredEpisode.description':
          'seasonLastAiredEpisode.description',
        'season.lastAiredEpisode.episodeNumber':
          'seasonLastAiredEpisode.episodeNumber',
        'season.lastAiredEpisode.imdbId': 'seasonLastAiredEpisode.imdbId',
        'season.lastAiredEpisode.isSpecialEpisode':
          'seasonLastAiredEpisode.isSpecialEpisode',
        'season.lastAiredEpisode.releaseDate':
          'seasonLastAiredEpisode.releaseDate',
        'season.lastAiredEpisode.runtime': 'seasonLastAiredEpisode.runtime',
        'season.lastAiredEpisode.seasonId': 'seasonLastAiredEpisode.seasonId',
        'season.lastAiredEpisode.seasonNumber':
          'seasonLastAiredEpisode.seasonNumber',
        'season.lastAiredEpisode.title': 'seasonLastAiredEpisode.title',
        'season.lastAiredEpisode.tmdbId': 'seasonLastAiredEpisode.tmdbId',
        'season.lastAiredEpisode.traktId': 'seasonLastAiredEpisode.traktId',
        'season.lastAiredEpisode.tvdbId': 'seasonLastAiredEpisode.tvdbId',
        'season.isSpecialSeason': 'season.isSpecialSeason',
        'season.lastSeenAt': 'seasonLastSeen.lastSeenAt',
        'season.releaseDate': 'season.releaseDate',
        'season.seasonNumber': 'season.seasonNumber',
        'season.seenEpisodesCount': 'seasonSeenEpisodes.seenEpisodesCount',
        'season.title': 'season.title',
        'season.tmdbId': 'season.tmdbId',
        'season.traktId': 'season.traktId',
        'season.tvdbId': 'season.tvdbId',
        'season.userRating.date': 'seasonRating.date',
        'season.userRating.rating': 'seasonRating.rating',
        'season.totalRuntime': 'seasonTotalRuntime.totalRuntime',
        'season.watchlist.id': 'seasonWatchlist.id',
      })
      .where('listItem.listId', listId)
      .leftJoin('mediaItem', 'mediaItem.id', 'listItem.mediaItemId')
      .leftJoin('season', 'season.id', 'listItem.seasonId')
      .leftJoin('episode', 'episode.id', 'listItem.episodeId')
      // MediaItem: watchlist
      .leftJoin<ListItem>(
        (qb) =>
          qb
            .from('listItem')
            .whereNull('listItem.seasonId')
            .whereNull('listItem.episodeId')
            .where('listItem.listId', watchlistId)
            .as('mediaItemWatchlist'),
        'mediaItemWatchlist.mediaItemId',
        'listItem.mediaItemId'
      )
      // Season: watchlist
      .leftJoin<ListItem>(
        (qb) =>
          qb
            .from('listItem')
            .whereNotNull('listItem.seasonId')
            .whereNull('listItem.episodeId')
            .where('listItem.listId', watchlistId)
            .as('seasonWatchlist'),
        'seasonWatchlist.seasonId',
        'listItem.seasonId'
      )
      // Episode: watchlist
      .leftJoin<ListItem>(
        (qb) =>
          qb
            .from('listItem')
            .whereNotNull('listItem.episodeId')
            .where('listItem.listId', watchlistId)
            .as('episodeWatchlist'),
        'episodeWatchlist.episodeId',
        'listItem.episodeId'
      )
      // Episode: last seen at
      .leftJoin(
        (qb) =>
          qb
            .select('episodeId')
            .max('date', { as: 'lastSeenAt' })
            .from('seen')
            .where('userId', userId)
            .where('type', 'seen')
            .groupBy('episodeId')
            .as('episodeLastSeen'),
        'episodeLastSeen.episodeId',
        'listItem.episodeId'
      )
      // Season: last seen at
      .leftJoin(
        (qb) =>
          qb
            .select({ episode_seasonId: 'episode.seasonId' })
            .max('date', { as: 'lastSeenAt' })
            .from('seen')
            .leftJoin('episode', 'episode.id', 'seen.episodeId')
            .where('userId', userId)
            .where('type', 'seen')
            .groupBy('episode_seasonId')
            .as('seasonLastSeen'),
        'seasonLastSeen.episode_seasonId',
        'listItem.seasonId'
      )
      // MediaItem: last seen at
      .leftJoin(
        (qb) =>
          qb
            .select('mediaItemId')
            .max('date', { as: 'lastSeenAt' })
            .from('seen')
            .where('userId', userId)
            .where('type', 'seen')
            .groupBy('mediaItemId')
            .as('mediaItemLastSeen'),
        'mediaItemLastSeen.mediaItemId',
        'listItem.mediaItemId'
      )
      // MediaItem: total runtime
      .leftJoin(
        (qb) =>
          qb
            .select('tvShowId')
            .leftJoin('mediaItem', 'mediaItem.id', 'tvShowId')
            .sum({
              totalRuntime: Database.knex.raw(`
                CASE
                  WHEN "episode"."runtime" IS NOT NULL THEN "episode"."runtime"
                  ELSE "mediaItem"."runtime"
                END`),
            })
            .from('episode')
            .groupBy('tvShowId')
            .where('episode.releaseDate', '<', currentDateString)
            .where('episode.isSpecialEpisode', false)
            .as('mediaItemTotalRuntime'),
        'mediaItemTotalRuntime.tvShowId',
        'listItem.mediaItemId'
      )
      // Season: total runtime
      .leftJoin(
        (qb) =>
          qb
            .select('seasonId')
            .leftJoin('mediaItem', 'mediaItem.id', 'tvShowId')
            .sum({
              totalRuntime: Database.knex.raw(`
                CASE
                  WHEN "episode"."runtime" IS NOT NULL THEN "episode"."runtime"
                  ELSE "mediaItem"."runtime"
                END`),
            })
            .from('episode')
            .groupBy('seasonId')
            .where('episode.isSpecialEpisode', false)
            .where('episode.releaseDate', '<', currentDateString)
            .as('seasonTotalRuntime'),
        'seasonTotalRuntime.seasonId',
        'listItem.seasonId'
      )
      // MediaItem: aired episodes count
      .leftJoin(
        (qb) =>
          qb
            .select('tvShowId')
            .count({ count: '*' })
            .from('episode')
            .groupBy('tvShowId')
            .where('episode.isSpecialEpisode', false)
            .where('releaseDate', '<', currentDateString)
            .as('mediaItemAiredEpisodes'),
        'mediaItemAiredEpisodes.tvShowId',
        'listItem.mediaItemId'
      )
      // Season: aired episodes count
      .leftJoin(
        (qb) =>
          qb
            .select('seasonId')
            .count({ count: '*' })
            .from('episode')
            .groupBy('seasonId')
            .where('releaseDate', '<', currentDateString)
            .as('seasonAiredEpisodes'),
        'seasonAiredEpisodes.seasonId',
        'listItem.seasonId'
      )
      // MediaItem: posterId
      .leftJoin<Image>(
        (qb) =>
          qb
            .from('image')
            .where('type', 'poster')
            .whereNull('seasonId')
            .as('mediaItemPoster'),
        'mediaItemPoster.mediaItemId',
        'listItem.mediaItemId'
      )
      // MediaItem: backdropId
      .leftJoin<Image>(
        (qb) =>
          qb
            .from('image')
            .where('type', 'backdrop')
            .whereNull('seasonId')
            .as('mediaItemBackdrop'),
        'mediaItemBackdrop.mediaItemId',
        'listItem.mediaItemId'
      )
      // MediaItem: user rating
      .leftJoin<UserRating>(
        (qb) =>
          qb
            .from('userRating')
            .whereNotNull('userRating.rating')
            .orWhereNotNull('userRating.review')
            .as('mediaItemRating'),
        (qb) =>
          qb
            .on('mediaItemRating.mediaItemId', 'listItem.mediaItemId')
            .andOnVal('mediaItemRating.userId', userId)
            .andOnNull('mediaItemRating.episodeId')
            .andOnNull('mediaItemRating.seasonId')
      )
      // Season: user rating
      .leftJoin<UserRating>(
        (qb) =>
          qb
            .from('userRating')
            .whereNotNull('userRating.rating')
            .orWhereNotNull('userRating.review')
            .as('seasonRating'),
        (qb) =>
          qb
            .andOnVal('seasonRating.userId', userId)
            .andOnNull('seasonRating.episodeId')
            .andOn('seasonRating.seasonId', 'listItem.seasonId')
      )
      // Episode: user rating
      .leftJoin<UserRating>(
        (qb) =>
          qb
            .from('userRating')
            .whereNotNull('userRating.rating')
            .orWhereNotNull('userRating.review')
            .as('episodeRating'),
        (qb) =>
          qb
            .andOnVal('episodeRating.userId', userId)
            .andOn('episodeRating.episodeId', 'listItem.episodeId')
            .andOnNull('episodeRating.seasonId')
      )
      // MediaItem: seen episodes count
      .leftJoin<Seen>(
        (qb) =>
          qb
            .select('mediaItemId')
            .count('*', { as: 'seenEpisodesCount' })
            .from((qb: Knex.QueryBuilder) =>
              qb
                .select('mediaItemId')
                .from<Seen>('seen')
                .where('type', 'seen')
                .where('userId', userId)
                .whereNotNull('episodeId')
                .groupBy('mediaItemId', 'episodeId')
                .leftJoin('episode', 'episode.id', 'seen.episodeId')
                .where('episode.isSpecialEpisode', false)
                .as('seen')
            )
            .groupBy('mediaItemId')
            .as('mediaItemSeenEpisodes'),
        'mediaItemSeenEpisodes.mediaItemId',
        'listItem.mediaItemId'
      )
      // Season: seen episodes count
      .leftJoin<Seen>(
        (qb) =>
          qb
            .select('mediaItemId')
            .count('*', { as: 'seenEpisodesCount' })
            .from((qb: Knex.QueryBuilder) =>
              qb
                .select('mediaItemId')
                .from<Seen>('seen')
                .where('type', 'seen')
                .where('userId', userId)
                .whereNotNull('episodeId')
                .groupBy('mediaItemId', 'episodeId')
                .leftJoin('episode', 'episode.id', 'seen.episodeId')
                .where('episode.isSpecialEpisode', false)
                .as('seen')
            )
            .groupBy('mediaItemId')
            .as('seasonSeenEpisodes'),
        'seasonSeenEpisodes.mediaItemId',
        'listItem.mediaItemId'
      )
      // MediaItem: first unwatched episode
      .leftJoin(
        (qb) =>
          qb
            .from('episode')
            .select('tvShowId')
            .min('seasonAndEpisodeNumber', {
              as: 'seasonAndEpisodeNumber',
            })
            .leftJoin('seen', (qb) =>
              qb
                .on('seen.episodeId', 'episode.id')
                .andOnVal('seen.type', 'seen')
            )
            .where('episode.isSpecialEpisode', false)
            .andWhereNot('episode.releaseDate', '')
            .andWhereNot('episode.releaseDate', null)
            .andWhere('episode.releaseDate', '<=', currentDateString)
            .andWhere((qb) => {
              qb.where('seen.userId', '<>', userId).orWhereNull('seen.userId');
            })
            .groupBy('tvShowId')
            .as('mediaItemFirstUnwatchedEpisodeHelper'),
        'mediaItemFirstUnwatchedEpisodeHelper.tvShowId',
        'listItem.mediaItemId'
      )
      .leftJoin(
        Database.knex.ref('episode').as('mediaItemFirstUnwatchedEpisode'),
        (qb) =>
          qb
            .on(
              'mediaItemFirstUnwatchedEpisode.tvShowId',
              'listItem.mediaItemId'
            )
            .andOn(
              'mediaItemFirstUnwatchedEpisode.seasonAndEpisodeNumber',
              'mediaItemFirstUnwatchedEpisodeHelper.seasonAndEpisodeNumber'
            )
      )
      // Season: first unwatched episode
      .leftJoin(
        (qb) =>
          qb
            .from('episode')
            .select('seasonId')
            .min('seasonAndEpisodeNumber', {
              as: 'seasonAndEpisodeNumber',
            })
            .leftJoin('seen', (qb) =>
              qb
                .on('seen.episodeId', 'episode.id')
                .andOnVal('seen.type', 'seen')
            )
            .where('episode.isSpecialEpisode', false)
            .andWhereNot('episode.releaseDate', '')
            .andWhereNot('episode.releaseDate', null)
            .andWhere('episode.releaseDate', '<=', currentDateString)
            .andWhere((qb) => {
              qb.where('seen.userId', '<>', userId).orWhereNull('seen.userId');
            })
            .groupBy('seasonId')
            .as('seasonFirstUnwatchedEpisodeHelper'),
        'seasonFirstUnwatchedEpisodeHelper.seasonId',
        'listItem.seasonId'
      )
      .leftJoin(
        Database.knex.ref('episode').as('seasonFirstUnwatchedEpisode'),
        (qb) =>
          qb
            .on('seasonFirstUnwatchedEpisode.seasonId', 'listItem.seasonId')
            .andOn(
              'seasonFirstUnwatchedEpisode.seasonAndEpisodeNumber',
              'seasonFirstUnwatchedEpisodeHelper.seasonAndEpisodeNumber'
            )
      )
      // MediaItem: progress
      .leftJoin<Seen>(
        (qb) =>
          qb
            .from<Seen>('seen')
            .select('mediaItemId')
            .max('date', { as: 'progressDate' })
            .whereNull('episodeId')
            .where('type', 'progress')
            .where('userId', userId)
            .groupBy('mediaItemId')
            .as('mediaItemProgressHelper'),
        'mediaItemProgressHelper.mediaItemId',
        'listItem.mediaItemId'
      )
      .leftJoin<Seen>(
        (qb) =>
          qb
            .from<Seen>('seen')
            .select('date')
            .max('progress', { as: 'progress' })
            .groupBy('date')
            .where('type', 'progress')
            .where('userId', userId)
            .whereNot('progress', 1)
            .as('mediaItemProgress'),
        (qb) =>
          qb
            .on('mediaItemProgressHelper.mediaItemId', 'listItem.mediaItemId')
            .andOn(
              'mediaItemProgressHelper.progressDate',
              'mediaItemProgress.date'
            )
      )
      // Episode: progress
      .leftJoin<Seen>(
        (qb) =>
          qb
            .from<Seen>('seen')
            .select('episodeId')
            .max('date', { as: 'progressDate' })
            .whereNotNull('episodeId')
            .where('type', 'progress')
            .where('userId', userId)
            .groupBy('episodeId')
            .as('episodeProgressHelper'),
        'episodeProgressHelper.episodeId',
        'listItem.episodeId'
      )
      .leftJoin<Seen>(
        (qb) =>
          qb
            .from<Seen>('seen')
            .select('date')
            .max('progress', { as: 'progress' })
            .groupBy('date')
            .where('type', 'progress')
            .where('userId', userId)
            .whereNot('progress', 1)
            .as('episodeProgress'),
        (qb) =>
          qb
            .on('episodeProgressHelper.episodeId', 'listItem.episodeId')
            .andOn('episodeProgressHelper.progressDate', 'episodeProgress.date')
      )
      // MediaItem: last aired episode
      .leftJoin<TvEpisode>(
        (qb) =>
          qb
            .from<TvEpisode>('episode')
            .select('tvShowId')
            .max('seasonAndEpisodeNumber', {
              as: 'seasonAndEpisodeNumber',
            })
            .where('isSpecialEpisode', false)
            .where('releaseDate', '<', currentDateString)
            .groupBy('tvShowId')
            .as('mediaItemLastAiredEpisodeHelper'),
        'mediaItemLastAiredEpisodeHelper.tvShowId',
        'listItem.mediaItemId'
      )
      .leftJoin<TvEpisode>(
        Database.knex.ref('episode').as('mediaItemLastAiredEpisode'),
        (qb) =>
          qb
            .on('mediaItemLastAiredEpisode.tvShowId', 'listItem.mediaItemId')
            .andOn(
              'mediaItemLastAiredEpisode.seasonAndEpisodeNumber',
              'mediaItemLastAiredEpisodeHelper.seasonAndEpisodeNumber'
            )
      )
      // Season: last aired episode
      .leftJoin<TvEpisode>(
        (qb) =>
          qb
            .from<TvEpisode>('episode')
            .select('tvShowId')
            .max('seasonAndEpisodeNumber', {
              as: 'seasonAndEpisodeNumber',
            })
            .where('isSpecialEpisode', false)
            .where('releaseDate', '<', currentDateString)
            .groupBy('tvShowId')
            .as('seasonLastAiredEpisodeHelper'),
        'seasonLastAiredEpisodeHelper.tvShowId',
        'listItem.mediaItemId'
      )
      .leftJoin<TvEpisode>(
        Database.knex.ref('episode').as('seasonLastAiredEpisode'),
        (qb) =>
          qb
            .on('seasonLastAiredEpisode.tvShowId', 'listItem.mediaItemId')
            .andOn(
              'seasonLastAiredEpisode.seasonAndEpisodeNumber',
              'seasonLastAiredEpisodeHelper.seasonAndEpisodeNumber'
            )
      )
      // MediaItem: upcoming episode
      .leftJoin<TvEpisode>(
        (qb) =>
          qb
            .from<TvEpisode>('episode')
            .select('tvShowId')
            .min('seasonAndEpisodeNumber', {
              as: 'seasonAndEpisodeNumber',
            })
            .where('isSpecialEpisode', false)
            .where('releaseDate', '>=', currentDateString)
            .groupBy('tvShowId')
            .as('mediaItemUpcomingEpisodeHelper'),
        'mediaItemUpcomingEpisodeHelper.tvShowId',
        'listItem.mediaItemId'
      )
      .leftJoin<TvEpisode>(
        Database.knex.ref('episode').as('mediaItemUpcomingEpisode'),
        (qb) =>
          qb
            .on('mediaItemUpcomingEpisode.tvShowId', 'listItem.mediaItemId')
            .andOn(
              'mediaItemUpcomingEpisode.seasonAndEpisodeNumber',
              'mediaItemUpcomingEpisodeHelper.seasonAndEpisodeNumber'
            )
      )
      .orderBy('listItem.rank', 'asc');

    return res.map((listItem) => ({
      rank: Number(listItem['listItem.rank']),
      id: Number(listItem['listItem.id']),
      listedAt: new Date(listItem['listItem.addedAt']).toISOString(),
      type: listItem['listItem.seasonId']
        ? 'season'
        : listItem['listItem.episodeId']
        ? 'episode'
        : listItem['mediaItem.mediaType'],
      mediaItem: {
        airedEpisodesCount: listItem['mediaItem.airedEpisodesCount'],
        backdrop: listItem['mediaItem.backdrop.id']
          ? `/img/${listItem['mediaItem.backdrop.id']}`
          : undefined,
        genres: listItem['mediaItem.genres']?.split(',')?.sort(),
        id: listItem['listItem.mediaItemId'],
        imdbId: listItem['mediaItem.imdbId'],
        lastTimeUpdated: listItem['mediaItem.lastTimeUpdated'],
        mediaType: listItem['mediaItem.mediaType'],
        network: listItem['mediaItem.network'],
        overview: listItem['mediaItem.overview'],
        poster: listItem['mediaItem.poster.id']
          ? `/img/${listItem['mediaItem.poster.id']}`
          : undefined,
        posterSmall: listItem['mediaItem.poster.id']
          ? `/img/${listItem['mediaItem.poster.id']}?size=small`
          : undefined,
        releaseDate: listItem['mediaItem.releaseDate'],
        runtime: listItem['mediaItem.runtime'] || null,
        slug: listItem['mediaItem.slug'],
        source: listItem['mediaItem.source'],
        progress: listItem['mediaItem.progress'],
        status: listItem['mediaItem.status']?.toLowerCase(),
        title: listItem['mediaItem.title'],
        tmdbId: listItem['mediaItem.tmdbId'],
        traktId: listItem['mediaItem.traktId'],
        tvdbId: listItem['mediaItem.tvdbId'],
        url: listItem['mediaItem.url'],
        userRating: listItem['mediaItem.userRating.rating']
          ? {
              mediaItemId: listItem['listItem.mediaItemId'],
              date: listItem['mediaItem.userRating.date'],
              rating: listItem['mediaItem.userRating.rating'],
              userId: userId,
            }
          : undefined,
        lastSeenAt: listItem['mediaItem.lastSeenAt'],
        totalRuntime:
          (listItem['mediaItem.mediaType'] === 'tv'
            ? listItem['mediaItem.totalRuntime']
            : listItem['mediaItem.runtime']) || null,
        seen:
          listItem['mediaItem.mediaType'] === 'tv'
            ? listItem['mediaItem.airedEpisodesCount'] -
                listItem['mediaItem.seenEpisodesCount'] ===
              0
            : Boolean(listItem['mediaItem.lastSeen.mediaItemId']),
        seenEpisodesCount: listItem['mediaItem.seenEpisodesCount'],
        onWatchlist: Boolean(listItem['mediaItem.watchlist.id']),
        firstUnwatchedEpisode:
          listItem['mediaItem.firstUnwatchedEpisode.id'] !== null
            ? {
                description:
                  listItem['mediaItem.firstUnwatchedEpisode.description'],
                episodeNumber:
                  listItem['mediaItem.firstUnwatchedEpisode.episodeNumber'],
                id: listItem['mediaItem.firstUnwatchedEpisode.id'],
                imdbId: listItem['mediaItem.firstUnwatchedEpisode.imdbId'],
                isSpecialEpisode: Boolean(
                  listItem['mediaItem.firstUnwatchedEpisode.isSpecialEpisode']
                ),
                releaseDate:
                  listItem['mediaItem.firstUnwatchedEpisode.releaseDate'],
                runtime:
                  listItem['mediaItem.firstUnwatchedEpisode.runtime'] || null,
                seasonId: listItem['mediaItem.firstUnwatchedEpisode.seasonId'],
                seasonNumber:
                  listItem['mediaItem.firstUnwatchedEpisode.seasonNumber'],
                title: listItem['mediaItem.firstUnwatchedEpisode.title'],
                tmdbId: listItem['mediaItem.firstUnwatchedEpisode.tmdbId'],
                traktId: listItem['mediaItem.firstUnwatchedEpisode.traktId'],
                tvdbId: listItem['mediaItem.firstUnwatchedEpisode.tvdbId'],
                tvShowId: listItem['listItem.mediaItemId'],
              }
            : undefined,
        lastAiredEpisode:
          listItem['mediaItem.lastAiredEpisode.id'] !== null
            ? {
                description: listItem['mediaItem.lastAiredEpisode.description'],
                episodeNumber:
                  listItem['mediaItem.lastAiredEpisode.episodeNumber'],
                id: listItem['mediaItem.lastAiredEpisode.id'],
                imdbId: listItem['mediaItem.lastAiredEpisode.imdbId'],
                isSpecialEpisode: Boolean(
                  listItem['mediaItem.lastAiredEpisode.isSpecialEpisode']
                ),
                releaseDate: listItem['mediaItem.lastAiredEpisode.releaseDate'],
                runtime: listItem['mediaItem.lastAiredEpisode.runtime'] || null,
                seasonId: listItem['mediaItem.lastAiredEpisode.seasonId'],
                seasonNumber:
                  listItem['mediaItem.lastAiredEpisode.seasonNumber'],
                title: listItem['mediaItem.lastAiredEpisode.title'],
                tmdbId: listItem['mediaItem.lastAiredEpisode.tmdbId'],
                traktId: listItem['mediaItem.lastAiredEpisode.traktId'],
                tvdbId: listItem['mediaItem.lastAiredEpisode.tvdbId'],
                tvShowId: listItem['listItem.mediaItemId'],
              }
            : undefined,
        upcomingEpisode:
          listItem['mediaItem.upcomingEpisode.id'] !== null
            ? {
                description: listItem['mediaItem.upcomingEpisode.description'],
                episodeNumber:
                  listItem['mediaItem.upcomingEpisode.episodeNumber'],
                id: listItem['mediaItem.upcomingEpisode.id'],
                imdbId: listItem['mediaItem.upcomingEpisode.imdbId'],
                isSpecialEpisode: Boolean(
                  listItem['mediaItem.upcomingEpisode.isSpecialEpisode']
                ),
                releaseDate: listItem['mediaItem.upcomingEpisode.releaseDate'],
                runtime: listItem['mediaItem.upcomingEpisode.runtime'] || null,
                seasonId: listItem['mediaItem.upcomingEpisode.seasonId'],
                seasonNumber:
                  listItem['mediaItem.upcomingEpisode.seasonNumber'],
                title: listItem['mediaItem.upcomingEpisode.title'],
                tmdbId: listItem['mediaItem.upcomingEpisode.tmdbId'],
                traktId: listItem['mediaItem.upcomingEpisode.traktId'],
                tvdbId: listItem['mediaItem.upcomingEpisode.tvdbId'],
                tvShowId: listItem['listItem.mediaItemId'],
              }
            : undefined,
      },
      ...(listItem['listItem.seasonId']
        ? {
            season: {
              id: listItem['listItem.seasonId'],
              isSpecialSeason: Boolean(listItem['season.isSpecialSeason']),
              airedEpisodesCount: listItem['season.airedEpisodesCount'],
              seenEpisodesCount: listItem['season.seenEpisodesCount'],
              seen:
                listItem['season.airedEpisodesCount'] -
                  listItem['season.seenEpisodesCount'] ===
                0,
              releaseDate: listItem['season.releaseDate'],
              seasonNumber: listItem['season.seasonNumber'],
              title: listItem['season.title'],
              tmdbId: listItem['season.tmdbId'],
              traktId: listItem['season.traktId'],
              tvdbId: listItem['season.tvdbId'],
              tvShowId: listItem['listItem.mediaItemId'],
              totalRuntime: listItem['season.totalRuntime'] || null,
              userRating: listItem['season.userRating.rating']
                ? {
                    mediaItemId: listItem['listItem.mediaItemId'],
                    seasonId: listItem['listItem.seasonId'],
                    date: listItem['season.userRating.date'],
                    rating: listItem['season.userRating.rating'],
                    userId: userId,
                  }
                : undefined,
              onWatchlist: Boolean(listItem['season.watchlist.id']),
              lastSeenAt: listItem['season.lastSeenAt'],
              firstUnwatchedEpisode: listItem[
                'season.firstUnwatchedEpisode.episodeNumber'
              ]
                ? {
                    description:
                      listItem['season.firstUnwatchedEpisode.description'],
                    episodeNumber:
                      listItem['season.firstUnwatchedEpisode.episodeNumber'],
                    id: listItem['season.firstUnwatchedEpisode.id'],
                    imdbId: listItem['season.firstUnwatchedEpisode.imdbId'],
                    isSpecialEpisode: Boolean(
                      listItem['season.firstUnwatchedEpisode.isSpecialEpisode']
                    ),
                    releaseDate:
                      listItem['season.firstUnwatchedEpisode.releaseDate'],
                    runtime:
                      listItem['season.firstUnwatchedEpisode.runtime'] || null,
                    seasonId: listItem['season.firstUnwatchedEpisode.seasonId'],
                    seasonNumber:
                      listItem['season.firstUnwatchedEpisode.seasonNumber'],
                    title: listItem['season.firstUnwatchedEpisode.title'],
                    tmdbId: listItem['season.firstUnwatchedEpisode.tmdbId'],
                    traktId: listItem['season.firstUnwatchedEpisode.traktId'],
                    tvdbId: listItem['season.firstUnwatchedEpisode.tvdbId'],
                    tvShowId: listItem['season.firstUnwatchedEpisode.tvShowId'],
                  }
                : undefined,
              lastAiredEpisode:
                listItem['season.lastAiredEpisode.id'] !== null
                  ? {
                      description:
                        listItem['season.lastAiredEpisode.description'],
                      episodeNumber:
                        listItem['season.lastAiredEpisode.episodeNumber'],
                      id: listItem['season.lastAiredEpisode.id'],
                      imdbId: listItem['season.lastAiredEpisode.imdbId'],
                      isSpecialEpisode: Boolean(
                        listItem['season.lastAiredEpisode.isSpecialEpisode']
                      ),
                      releaseDate:
                        listItem['season.lastAiredEpisode.releaseDate'],
                      runtime:
                        listItem['season.lastAiredEpisode.runtime'] || null,
                      seasonId: listItem['season.lastAiredEpisode.seasonId'],
                      seasonNumber:
                        listItem['season.lastAiredEpisode.seasonNumber'],
                      title: listItem['season.lastAiredEpisode.title'],
                      tmdbId: listItem['season.lastAiredEpisode.tmdbId'],
                      traktId: listItem['season.lastAiredEpisode.traktId'],
                      tvdbId: listItem['season.lastAiredEpisode.tvdbId'],
                      tvShowId: listItem['listItem.mediaItemId'],
                    }
                  : undefined,
            },
          }
        : {}),
      ...(listItem['listItem.episodeId']
        ? {
            episode: {
              episodeNumber: listItem['episode.episodeNumber'],
              id: listItem['listItem.episodeId'],
              imdbId: listItem['episode.imdbId'],
              isSpecialEpisode: Boolean(listItem['episode.isSpecialEpisode']),
              releaseDate: listItem['episode.releaseDate'],
              seasonNumber: listItem['episode.seasonNumber'],
              title: listItem['episode.title'],
              tmdbId: listItem['episode.tmdbId'],
              traktId: listItem['episode.traktId'],
              tvdbId: listItem['episode.tvdbId'],
              tvShowId: listItem['listItem.mediaItemId'],
              seasonAndEpisodeNumber:
                listItem['episode.seasonAndEpisodeNumber'],
              progress: listItem['episode.progress'],
              runtime: listItem['episode.runtime'] || null,
              userRating: listItem['episode.userRating.rating']
                ? {
                    mediaItemId: listItem['listItem.mediaItemId'],
                    episodeId: listItem['listItem.episodeId'],
                    date: listItem['episode.userRating.date'],
                    rating: listItem['episode.userRating.rating'],
                    userId: userId,
                  }
                : undefined,
              onWatchlist: Boolean(listItem['episode.watchlist.id']),
              lastSeenAt: listItem['episode.lastSeenAt'],
              seen: Boolean(listItem['episode.lastSeenAt']),
            },
          }
        : {}),
    }));
  }
}

export const listRepository = new ListRepository();
