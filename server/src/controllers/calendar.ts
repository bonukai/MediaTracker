import _ from 'lodash';
import { parseISO } from 'date-fns';

import { createExpressRoute } from 'typescript-routes-to-openapi-server';
import { Database } from 'src/dbconfig';
import { MediaType } from 'src/entity/mediaItem';

/**
 * @openapi_tags Calendar
 */
export class CalendarController {
  /**
   * @openapi_operationId get
   */
  get = createExpressRoute<{
    method: 'get';
    path: '/api/calendar';
    requestQuery: {
      /**
       * @description Date string in ISO 8601 format
       * @example 2022-05-21
       */
      start?: string;
      /**
       * @description Date string in ISO 8601 format
       * @example 2022-05-21T23:37:36+00:00
       */
      end?: string;
    };
    responseBody: GetCalendarItemsResponse;
  }>(async (req, res) => {
    const userId = Number(req.user);

    const { start, end } = req.query;

    res.send(
      await getCalendarItems({
        userId,
        start: parseISO(start).toISOString(),
        end: parseISO(end).toISOString(),
      })
    );
  });
}

export type GetCalendarItemsResponse = {
  releaseDate: string;
  mediaItem: {
    id: number;
    title: string;
    releaseDate: string;
    slug: string;
    mediaType: MediaType;
    seen?: boolean;
  };
  episode: {
    id: number;
    title: string;
    episodeNumber: number;
    seasonNumber: number;
    releaseDate: string;
    isSpecialEpisode: boolean;
    seen: boolean;
  };
}[];

export const getCalendarItems = async (args: {
  userId: number;
  start: string;
  end: string;
}): Promise<GetCalendarItemsResponse> => {
  const { userId, start, end } = args;

  const res = await Database.knex('list')
    .select({
      'episode.episodeNumber': 'episode.episodeNumber',
      'episode.id': 'episode.id',
      'episode.isSpecialEpisode': 'episode.isSpecialEpisode',
      'episode.releaseDate': 'episode.releaseDate',
      'episode.runtime': 'episode.runtime',
      'episode.seasonNumber': 'episode.seasonNumber',
      'episode.seen': 'episodeSeen.episodeId',
      'episode.title': 'episode.title',
      'listItem.episodeId': 'listItem.episodeId',
      'listItem.mediaItemId': 'listItem.mediaItemId',
      'listItem.seasonId': 'listItem.seasonId',
      'mediaItem.mediaType': 'mediaItem.mediaType',
      'mediaItem.releaseDate': 'mediaItem.releaseDate',
      'mediaItem.runtime': 'mediaItem.runtime',
      'mediaItem.seen': 'mediaItemSeen.mediaItemId',
      'mediaItem.slug': 'mediaItem.slug',
      'mediaItem.title': 'mediaItem.title',
      'mediaItemEpisode.episodeNumber': 'mediaItemEpisode.episodeNumber',
      'mediaItemEpisode.id': 'mediaItemEpisode.id',
      'mediaItemEpisode.isSpecialEpisode': 'mediaItemEpisode.isSpecialEpisode',
      'mediaItemEpisode.releaseDate': 'mediaItemEpisode.releaseDate',
      'mediaItemEpisode.seasonNumber': 'mediaItemEpisode.seasonNumber',
      'mediaItemEpisode.title': 'mediaItemEpisode.title',
      'season.releaseDate': 'season.releaseDate',
      'seasonEpisode.episodeNumber': 'seasonEpisode.episodeNumber',
      'seasonEpisode.id': 'seasonEpisode.id',
      'seasonEpisode.isSpecialEpisode': 'seasonEpisode.isSpecialEpisode',
      'seasonEpisode.releaseDate': 'seasonEpisode.releaseDate',
      'seasonEpisode.seasonNumber': 'seasonEpisode.seasonNumber',
      'seasonEpisode.title': 'seasonEpisode.title',
    })

    .leftJoin('listItem', 'listItem.listId', 'list.id')
    .leftJoin('mediaItem', 'mediaItem.id', 'listItem.mediaItemId')
    .leftJoin('season', 'season.id', 'listItem.seasonId')
    .leftJoin('episode', 'episode.id', 'listItem.episodeId')
    .leftJoin(Database.knex.ref('episode').as('mediaItemEpisode'), (qb) =>
      qb
        .on('mediaItemEpisode.tvShowId', 'listItem.mediaItemId')
        .onNull('listItem.episodeId')
        .onNull('listItem.seasonId')
    )
    .leftJoin(Database.knex.ref('episode').as('seasonEpisode'), (qb) =>
      qb
        .on('seasonEpisode.seasonId', 'listItem.seasonId')
        .onNull('listItem.episodeId')
    )
    // Episode: seen
    .leftJoin(
      (qb) =>
        qb
          .select('episodeId')
          .from('seen')
          .where('userId', userId)
          .where('type', 'seen')
          .groupBy('episodeId')
          .as('episodeSeen'),
      (qb) =>
        qb
          .orOn('episodeSeen.episodeId', 'listItem.episodeId')
          .orOn('episodeSeen.episodeId', 'seasonEpisode.id')
          .orOn('episodeSeen.episodeId', 'mediaItemEpisode.id')
    )
    // MediaItem: seen
    .leftJoin(
      (qb) =>
        qb
          .select('mediaItemId')
          .from('seen')
          .where('userId', userId)
          .where('type', 'seen')
          .groupBy('mediaItemId')
          .as('mediaItemSeen'),
      (qb) =>
        qb
          .on('mediaItemSeen.mediaItemId', 'listItem.mediaItemId')
          .andOnNull('listItem.seasonId')
          .andOnNull('listItem.episodeId')
    )
    .where('userId', userId)
    .where('isWatchlist', true)
    .where((qb) =>
      qb
        .orWhere((qb) =>
          qb
            .whereNot('mediaItem.mediaType', 'tv')
            .andWhereBetween('mediaItem.releaseDate', [start, end])
        )
        .orWhereBetween('episode.releaseDate', [start, end])
        .orWhereBetween('seasonEpisode.releaseDate', [start, end])
        .orWhereBetween('mediaItemEpisode.releaseDate', [start, end])
    );

  const mappedItems = res.map((row) => ({
    mediaItem: {
      id: row['listItem.mediaItemId'],
      title: row['mediaItem.title'],
      releaseDate: row['mediaItem.releaseDate'],
      slug: row['mediaItem.slug'],
      mediaType: row['mediaItem.mediaType'],
      seen: row['mediaItem.seen'] != undefined,
    },
    ...(row['episode.releaseDate']
      ? {
          episode: {
            id: row['listItem.episodeId'],
            title: row['episode.title'],
            episodeNumber: row['episode.episodeNumber'],
            seasonNumber: row['episode.seasonNumber'],
            releaseDate: row['episode.releaseDate'],
            seen: row['episode.seen'] != undefined,
            isSpecialEpisode: Boolean(row['episode.isSpecialEpisode']),
          },
        }
      : {}),
    ...(row['mediaItemEpisode.releaseDate']
      ? {
          episode: {
            id: row['mediaItemEpisode.id'],
            title: row['mediaItemEpisode.title'],
            episodeNumber: row['mediaItemEpisode.episodeNumber'],
            seasonNumber: row['mediaItemEpisode.seasonNumber'],
            releaseDate: row['mediaItemEpisode.releaseDate'],
            seen: row['episode.seen'] != undefined,
            isSpecialEpisode: Boolean(row['mediaItemEpisode.isSpecialEpisode']),
          },
        }
      : {}),
    ...(row['seasonEpisode.releaseDate']
      ? {
          episode: {
            id: row['seasonEpisode.id'],
            title: row['seasonEpisode.title'],
            episodeNumber: row['seasonEpisode.episodeNumber'],
            seasonNumber: row['seasonEpisode.seasonNumber'],
            releaseDate: row['seasonEpisode.releaseDate'],
            seen: row['episode.seen'] != undefined,
            isSpecialEpisode: Boolean(row['seasonEpisode.isSpecialEpisode']),
          },
        }
      : {}),
  }));

  const [episodes, mediaItems] = _.partition(
    mappedItems,
    (value) => value.episode
  );

  const uniqueEpisodes = _.uniqBy(episodes, (episode) => episode.episode?.id);

  return _([...uniqueEpisodes, ...mediaItems])
    .map((value) =>
      value.episode
        ? {
            releaseDate: value.episode.releaseDate,
            ...value,
          }
        : {
            releaseDate: value.mediaItem.releaseDate,
            ...value,
          }
    )
    .orderBy((item) =>
      item.episode
        ? item.episode.seasonNumber * 1000 + item.episode.episodeNumber
        : item.releaseDate
    )
    .orderBy('releaseDate')
    .value() as GetCalendarItemsResponse;
};
