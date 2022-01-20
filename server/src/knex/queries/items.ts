import _ from 'lodash';
import {
    mediaItemBackdropPath,
    MediaItemBase,
    mediaItemColumns,
    MediaItemItemsResponse,
    mediaItemPosterPath,
} from 'src/entity/mediaItem';
import { knex } from 'src/dbconfig';

import { Seen } from 'src/entity/seen';
import { UserRating, userRatingColumns } from 'src/entity/userRating';
import { GetItemsArgs } from 'src/repository/mediaItem';
import { TvEpisode, tvEpisodeColumns } from 'src/entity/tvepisode';
import { Watchlist, watchlistColumns } from 'src/entity/watchlist';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getItemsKnex = async (args: any): Promise<any> => {
    const { page } = args;
    const { sqlQuery, sqlCountQuery, sqlPaginationQuery } =
        await getItemsKnexSql(args);

    if (page) {
        const [resCount, res] = await knex.transaction(async (trx) => {
            const resCount = await sqlCountQuery.transacting(trx);
            const res = await sqlPaginationQuery.transacting(trx);

            return [resCount, res];
        });

        const itemsPerPage = 40;
        const total = Number(resCount[0].count);
        const from = itemsPerPage * (page - 1);
        const to = Math.min(total, itemsPerPage * page);
        const totalPages = Math.ceil(total / itemsPerPage);

        if (from > total) {
            throw new Error('Invalid page number');
        }

        const data = res.map(mapRawResult);

        return {
            from: from,
            to: to,
            data: data,
            total: total,
            page: page,
            totalPages: totalPages,
        };
    } else {
        const res = await sqlQuery;
        return res.map(mapRawResult);
    }
};

const getItemsKnexSql = async (args: GetItemsArgs) => {
    const {
        onlyOnWatchlist,
        mediaType,
        userId,
        filter,
        orderBy,
        page,
        onlySeenItems,
        sortOrder,
        onlyWithNextEpisodesToWatch,
        onlyWithNextAiring,
        mediaItemIds,
        onlyWithUserRating,
        onlyWithoutUserRating,
    } = args;

    const currentDateString = new Date().toISOString();

    const query = knex
        .select(generateColumnNames('firstUnwatchedEpisode', tvEpisodeColumns))
        .select(generateColumnNames('watchlist', watchlistColumns))
        .select(generateColumnNames('upcomingEpisode', tvEpisodeColumns))
        .select(generateColumnNames('userRating', userRatingColumns))
        .select(generateColumnNames('mediaItem', mediaItemColumns))
        .select({
            lastSeenAt: 'lastSeen.date',
            numberOfEpisodes: 'numberOfEpisodes',
            unseenEpisodesCount: 'unseenEpisodesCount',
        })
        .from<MediaItemBase>('mediaItem')
        .leftJoin<Seen>(
            (qb) =>
                qb
                    .select('mediaItemId')
                    .max('date', { as: 'date' })
                    .from<Seen>('seen')
                    .where('userId', userId)
                    .groupBy('mediaItemId')
                    .as('lastSeen'),
            'lastSeen.mediaItemId',
            'mediaItem.id'
        )
        // Number of episodes
        .leftJoin<TvEpisode>(
            (qb) =>
                qb
                    .select('tvShowId')
                    .count('*', { as: 'numberOfEpisodes' })
                    .from<TvEpisode>('episode')
                    .whereNot('isSpecialEpisode', 1)
                    .andWhereNot('releaseDate', '')
                    .andWhereNot('releaseDate', null)
                    .andWhere('releaseDate', '<=', currentDateString)
                    .groupBy('tvShowId')
                    .as('numberOfEpisodes'),
            'numberOfEpisodes.tvShowId',
            'mediaItem.id'
        )
        // On watchlist
        .leftJoin<Watchlist>('watchlist', (qb) => {
            qb.on('watchlist.mediaItemId', 'mediaItem.id').andOnVal(
                'watchlist.userId',
                userId
            );
        })
        // Upcoming episode
        .leftJoin<TvEpisode>(
            (qb) =>
                qb
                    .from<TvEpisode>('episode')
                    .select('tvShowId')
                    .min('releaseDate', { as: 'upcomingEpisodeReleaseDate' })
                    .min('seasonNumber', { as: 'upcomingEpisodeSeasonNumber' })
                    .min('episodeNumber', {
                        as: 'upcomingEpisodeEpisodeNumber',
                    })
                    .whereNot('isSpecialEpisode', 1)
                    .where('releaseDate', '>=', currentDateString)
                    .groupBy('tvShowId')
                    .as('upcomingEpisodeHelper'),
            'upcomingEpisodeHelper.tvShowId',
            'mediaItem.id'
        )
        .leftJoin<TvEpisode>(
            (qb) => qb.from<TvEpisode>('episode').as('upcomingEpisode'),
            (qb) =>
                qb
                    .on('upcomingEpisode.tvShowId', 'mediaItem.id')
                    .andOn(
                        'upcomingEpisode.seasonNumber',
                        'upcomingEpisodeSeasonNumber'
                    )
                    .andOn(
                        'upcomingEpisode.episodeNumber',
                        'upcomingEpisodeEpisodeNumber'
                    )
        )
        // First unwatched episode and unseen episodes count
        .leftJoin<TvEpisode>(
            (qb) =>
                qb
                    .from<TvEpisode>('episode')
                    .select('tvShowId')
                    .min('seasonAndEpisodeNumber', {
                        as: 'seasonAndEpisodeNumber',
                    })
                    .count('*', { as: 'unseenEpisodesCount' })
                    .leftJoin<Seen>('seen', 'seen.episodeId', 'episode.id')
                    .whereNot('episode.isSpecialEpisode', 1)
                    .andWhereNot('episode.releaseDate', '')
                    .andWhereNot('episode.releaseDate', null)
                    .andWhere('episode.releaseDate', '<=', currentDateString)
                    .andWhere((qb) => {
                        qb.where('seen.userId', '<>', userId).orWhere(
                            'seen.userId',
                            null
                        );
                    })
                    .groupBy('tvShowId')
                    .as('firstUnwatchedEpisodeHelper'),
            'firstUnwatchedEpisodeHelper.tvShowId',
            'mediaItem.id'
        )
        .leftJoin<TvEpisode>(
            (qb) => qb.from<TvEpisode>('episode').as('firstUnwatchedEpisode'),
            (qb) =>
                qb
                    .on('firstUnwatchedEpisode.tvShowId', 'mediaItem.id')
                    .andOn(
                        'firstUnwatchedEpisode.seasonAndEpisodeNumber',
                        'firstUnwatchedEpisodeHelper.seasonAndEpisodeNumber'
                    )
        )
        // User rating
        .leftJoin<UserRating>('userRating', (qb) =>
            qb
                .on('userRating.mediaItemId', 'mediaItem.id')
                .andOnVal('userRating.userId', userId)
                .andOnNull('userRating.episodeId')
                .andOnNull('userRating.seasonId')
        );

    if (Array.isArray(mediaItemIds)) {
        query.whereIn('mediaItem.id', mediaItemIds);
    } else {
        query.where((qb) =>
            qb
                .whereNotNull('watchlist.mediaItemId')
                .orWhereNotNull('lastSeen.mediaItemId')
        );

        if (onlyOnWatchlist) {
            query.whereNotNull('watchlist.mediaItemId');
        }

        if (onlySeenItems === true) {
            query.whereNotNull('lastSeen.mediaItemId');
        }

        if (onlySeenItems === false) {
            query
                .andWhereNot((qb) =>
                    qb
                        .where('mediaItem.mediaType', 'tv')
                        .andWhere('firstUnwatchedEpisode.tvShowId', null)
                )
                .andWhere((qb) =>
                    qb
                        .where('mediaItem.mediaType', 'tv')
                        .orWhere(
                            'mediaItem.releaseDate',
                            '<=',
                            currentDateString
                        )
                );
        }

        // Media type
        if (mediaType) {
            query.andWhere('mediaItem.mediaType', mediaType);
        }

        // Filter
        if (filter && filter.trim().length > 0) {
            query.andWhere('mediaItem.title', 'LIKE', `%${filter}%`);
        }

        // Next airing
        if (onlyWithNextAiring) {
            if (mediaType) {
                if (mediaType === 'tv') {
                    query.andWhere(
                        'upcomingEpisode.releaseDate',
                        '>',
                        currentDateString
                    );
                } else {
                    query.andWhere(
                        'mediaItem.releaseDate',
                        '>',
                        currentDateString
                    );
                }
            } else {
                query.andWhere((qb) => {
                    qb.where((qb) => {
                        qb.whereNot('mediaItem.mediaType', 'tv').andWhere(
                            'mediaItem.releaseDate',
                            '>',
                            currentDateString
                        );
                    }).orWhere((qb) => {
                        qb.where('mediaItem.mediaType', 'tv').andWhere(
                            'upcomingEpisode.releaseDate',
                            '>',
                            currentDateString
                        );
                    });
                });
            }

            query.andWhereNot('watchlist.mediaItemId', null);
        }

        // nextEpisodesToWatchSubQuery
        if (onlyWithNextEpisodesToWatch === true) {
            query
                .andWhereNot((qb) =>
                    qb
                        .where('mediaItem.mediaType', 'tv')
                        .andWhere('firstUnwatchedEpisode.tvShowId', null)
                )
                .andWhere((qb) =>
                    qb
                        .where('mediaItem.mediaType', 'tv')
                        .orWhere(
                            'mediaItem.releaseDate',
                            '<=',
                            currentDateString
                        )
                );
        }

        if (onlyWithUserRating === true) {
            query.andWhereNot('userRating.mediaItemId', null);
        }

        if (onlyWithoutUserRating === true) {
            query.andWhere('userRating.mediaItemId', null);
        }
    }

    if (orderBy && sortOrder) {
        if (
            sortOrder.toLowerCase() !== 'asc' &&
            sortOrder.toLowerCase() !== 'desc'
        ) {
            throw new Error('Sort order should by either asc or desc');
        }

        switch (orderBy) {
            case 'title':
                query.orderBy('mediaItem.title', sortOrder);
                break;

            case 'releaseDate':
                query.orderBy('mediaItem.releaseDate', sortOrder);
                query.orderBy('mediaItem.title', 'asc');
                break;

            case 'status':
                query.orderBy('mediaItem.status', sortOrder);
                query.orderBy('mediaItem.title', 'asc');
                break;

            case 'mediaType':
                query.orderBy('mediaItem.mediaType', sortOrder);
                query.orderBy('mediaItem.title', 'asc');

                break;

            case 'unseenEpisodes':
                query.orderBy('unseenEpisodesCount', sortOrder);
                query.orderBy('mediaItem.title', 'asc');
                break;

            case 'lastSeen':
                query.orderBy('lastSeenAt', sortOrder);
                query.orderBy('mediaItem.title', 'asc');
                break;

            case 'nextAiring':
                query.orderByRaw(
                    knex.raw(`CASE
        WHEN "mediaItem"."mediaType" = 'tv' THEN "upcomingEpisode"."releaseDate"
        ELSE "mediaItem"."releaseDate"
      END ${sortOrder} NULLS LAST`)
                );
                query.orderBy('mediaItem.title', 'asc');
                break;

            default:
                throw new Error(`Unsupported orderBy value: ${orderBy}`);
        }
    }

    const sqlCountQuery = query
        .clone()
        .clearOrder()
        .clearSelect()
        .count('*', { as: 'count' });

    let sqlPaginationQuery;

    if (page) {
        const itemsPerPage = 40;
        const skip = itemsPerPage * (page - 1);
        const take = itemsPerPage;

        sqlPaginationQuery = query.clone().limit(take).offset(skip);
    }

    return {
        sqlQuery: query,
        sqlCountQuery: sqlCountQuery,
        sqlPaginationQuery: sqlPaginationQuery,
    };
};

export const generateColumnNames = <
    Prefix extends string,
    Properties extends ReadonlyArray<string>
>(
    prefix: Prefix,
    properties: Properties
) => {
    return properties.reduce(
        (previous, property) => ({
            ...previous,
            [`${prefix}.${property}`]: `${prefix}.${property}`,
        }),
        {}
    ) as {
        [Key in `${Prefix}.${Properties[number]}`]: Key;
    };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapRawResult = (row: any): MediaItemItemsResponse => {
    return {
        id: row['mediaItem.id'],
        tmdbId: row['mediaItem.tmdbId'],
        tvmazeId: row['mediaItem.tvmazeId'],
        igdbId: row['mediaItem.igdbId'],
        openlibraryId: row['mediaItem.openlibraryId'],
        imdbId: row['mediaItem.imdbId'],
        audibleId: row['mediaItem.audibleId'],
        mediaType: row['mediaItem.mediaType'],
        numberOfSeasons: row['mediaItem.numberOfSeasons'],
        status: row['mediaItem.status'],
        platform: row['mediaItem.platform'],
        title: row['mediaItem.title'],
        originalTitle: row['mediaItem.originalTitle'],
        tmdbRating: row['mediaItem.tmdbRating'],
        runtime: row['mediaItem.runtime'],
        releaseDate: row['mediaItem.releaseDate'],
        overview: row['mediaItem.overview'],
        lastTimeUpdated: row['mediaItem.lastTimeUpdated'],
        source: row['mediaItem.source'],
        network: row['mediaItem.network'],
        language: row['mediaItem.language'],
        genres: row['mediaItem.genres']?.split(','),
        authors: row['mediaItem.authors']?.split(','),
        narrators: row['mediaItem.narrators']?.split(','),
        url: row['mediaItem.url'],
        developer: row['mediaItem.developer'],
        lastSeenAt: row['lastSeenAt'],
        poster: row['mediaItem.poster']
            ? mediaItemPosterPath(row['mediaItem.id'], 'original')
            : null,
        posterSmall: row['mediaItem.poster']
            ? mediaItemPosterPath(row['mediaItem.id'], 'small')
            : null,
        backdrop: row['mediaItem.backdrop']
            ? mediaItemBackdropPath(row['mediaItem.id'])
            : null,
        hasDetails: false,
        seen:
            row['mediaItem.mediaType'] === 'tv'
                ? row.numberOfEpisodes > 0 && !row.unseenEpisodesCount
                : row['lastSeenAt'] != undefined,

        onWatchlist: Boolean(row['watchlist.id']),
        unseenEpisodesCount: row.unseenEpisodesCount || 0,
        numberOfEpisodes: row.numberOfEpisodes,
        nextAiring: row.nextAiring,
        userRating: row['userRating.id']
            ? {
                  id: row['userRating.id'],
                  date: row['userRating.date'],
                  mediaItemId: row['userRating.mediaItemId'],
                  rating: row['userRating.rating'],
                  review: row['userRating.review'],
                  userId: row['userRating.userId'],
                  episodeId: row['userRating.episodeId'],
                  seasonId: row['userRating.seasonId'],
              }
            : undefined,
        firstUnwatchedEpisode: row['firstUnwatchedEpisode.id']
            ? {
                  id: row['firstUnwatchedEpisode.id'],
                  title: row['firstUnwatchedEpisode.title'],
                  description: row['firstUnwatchedEpisode.description'],
                  episodeNumber: row['firstUnwatchedEpisode.episodeNumber'],
                  seasonNumber: row['firstUnwatchedEpisode.seasonNumber'],
                  releaseDate: row['firstUnwatchedEpisode.releaseDate'],
                  tvShowId: row['firstUnwatchedEpisode.tvShowId'],
                  tmdbId: row['firstUnwatchedEpisode.tmdbId'],
                  imdbId: row['firstUnwatchedEpisode.imdbId'],
                  runtime: row['firstUnwatchedEpisode.runtime'],
                  seasonId: row['firstUnwatchedEpisode.seasonId'],
                  isSpecialEpisode: Boolean(
                      row['firstUnwatchedEpisode.isSpecialEpisode']
                  ),
                  userRating: undefined,
                  seenHistory: undefined,
                  lastSeenAt: undefined,
              }
            : undefined,
        upcomingEpisode: row['upcomingEpisode.releaseDate']
            ? {
                  id: row['upcomingEpisode.id'],
                  title: row['upcomingEpisode.title'],
                  description: row['upcomingEpisode.description'],
                  episodeNumber: row['upcomingEpisode.episodeNumber'],
                  seasonNumber: row['upcomingEpisode.seasonNumber'],
                  releaseDate: row['upcomingEpisode.releaseDate'],
                  runtime: row['upcomingEpisode.runtime'],
                  tvShowId: row['upcomingEpisode.tvShowId'],
                  tmdbId: row['upcomingEpisode.tmdbId'],
                  imdbId: row['upcomingEpisode.imdbId'],
                  seasonId: row['upcomingEpisode.seasonId'],
                  isSpecialEpisode: Boolean(
                      row['upcomingEpisode.isSpecialEpisode']
                  ),
                  userRating: undefined,
                  seenHistory: undefined,
                  lastSeenAt: undefined,
                  seen: false,
              }
            : undefined,
    };
};
