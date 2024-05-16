import { addHours, formatISO, min, subHours } from 'date-fns';
import _ from 'lodash';

import { i18n } from '@lingui/core';

import { Database } from './database.js';
import { EpisodeModel } from './entity/episodeModel.js';
import { MediaItemModel } from './entity/mediaItemModel.js';
import { UserResponse } from './entity/userModel.js';
import { logger } from './logger.js';
import { formatNotification } from './notifications/formatNotification.js';
import { notificationPlatforms } from './notifications/notificationPlatforms.js';
import { userRepository } from './repository/userRepository.js';
import { scheduleJob } from './scheduler.js';
import {
  formatEpisodeNumber,
  h,
  is,
  splitWhereInQuery,
  withDefinedPropertyFactory,
} from './utils.js';

export const sendAndScheduledNotificationsForReleases = async () => {
  const currentTime = new Date();
  const nextDay = addHours(currentTime, 24);

  await sendNotificationsForTvShows();
  await sendNotificationsForNonTvShows();

  const firstNextEpisode = await Database.knex('episode')
    .min({ releaseDate: 'releaseDate' })
    .whereBetween('releaseDate', [formatISO(currentTime), formatISO(nextDay)])
    .first();

  const nextTvUpdate = firstNextEpisode?.releaseDate
    ? new Date(firstNextEpisode.releaseDate)
    : nextDay;

  const firstNonTv = await Database.knex('mediaItem')
    .min({ releaseDate: 'releaseDate' })
    .whereBetween('releaseDate', [formatISO(currentTime), formatISO(nextDay)])
    .first();

  const nextNonTvUpdate = firstNonTv?.releaseDate
    ? new Date(firstNonTv.releaseDate)
    : nextDay;

  const nextScheduleDate = min([nextTvUpdate, nextNonTvUpdate]);

  scheduleJob({
    date: nextScheduleDate,
    behaviorOnDuplicateJob: 'override',
    name: 'notifications for releases',
    job: () => sendAndScheduledNotificationsForReleases(),
  });
};

const buildNotification = (args: {
  user: UserResponse;
  mediaItem: MediaItemModel;
  episodes?: EpisodeModel[];
}) => {
  const { user, mediaItem, episodes } = args;

  i18n.activate(user.preferences.language || 'en');

  if (episodes) {
    const firstEpisode = episodes.at(0);

    if (!firstEpisode) {
      throw new Error(`episodes array cannot be empty`);
    }

    if (episodes.length === 1 && firstEpisode.midSeasonFinale) {
      return formatNotification(({ mediaItemUrl }) =>
        i18n._('Mid season finale of {title} has been released', {
          title: mediaItemUrl(mediaItem),
        })
      );
    } else if (episodes.length === 1 && firstEpisode.seasonFinale) {
      return formatNotification(({ mediaItemUrl }) =>
        i18n._('Season finale of {title} has been released', {
          title: mediaItemUrl(mediaItem),
        })
      );
    } else {
      return formatNotification(({ mediaItemUrl }) =>
        i18n._(
          '{count, plural, one {{title} {episode} has been released} other {# episodes of {title} has been released}}',
          {
            title: mediaItemUrl(mediaItem),
            episode: formatEpisodeNumber(firstEpisode),
            count: episodes.length,
          }
        )
      );
    }
  } else {
    return formatNotification(({ mediaItemUrl }) =>
      i18n._('{title} has been released', {
        title: mediaItemUrl(mediaItem),
      })
    );
  }
};

const sendNotification = async (args: {
  user: UserResponse;
  mediaItem: MediaItemModel;
  episodes?: EpisodeModel[];
}) => {
  const { user, mediaItem, episodes } = args;

  if (mediaItem.mediaType === 'tv' && (!episodes || episodes.length === 0)) {
    throw new Error(
      `mediaItem ${mediaItem.id} of type "tv" should have episodes for notifications`
    );
  }

  if (!user.preferences.sendNotificationForReleases) {
    return;
  }

  await notificationPlatforms.sendToUser({
    user,
    content: {
      title: 'MediaTracker',
      body: buildNotification({ user, mediaItem, episodes }),
    },
  });
};

const sendNotificationsForNonTvShows = async () => {
  const { seenHistory, usersToSend, pastReleasedMediaItems } =
    await Database.knex.transaction(async (trx) => {
      const currentTimestamp = Date.now();

      const pastReleasedMediaItems = await trx('mediaItem')
        .select<MediaItemModel[]>('mediaItem.*')
        .whereNot('mediaType', 'tv')
        .whereBetween('releaseDate', [
          formatISO(subHours(currentTimestamp, 24)),
          formatISO(currentTimestamp),
        ])
        .leftJoin(
          'notificationsHistory',
          'notificationsHistory.mediaItemId',
          'mediaItem.id'
        )
        .whereNull('notificationsHistory.id');

      const mediaItemIds = _(pastReleasedMediaItems)
        .map((item) => item.id)
        .uniq()
        .value();

      const seenHistory = await splitWhereInQuery(mediaItemIds, (chunk) =>
        trx('seen').whereIn('mediaItemId', chunk)
      );

      const usersToSend = await splitWhereInQuery(mediaItemIds, (chunk) =>
        trx('listItem')
          .select<{ userId: number; mediaItemId: number }[]>(
            'list.userId',
            'mediaItemId'
          )
          .whereIn('mediaItemId', chunk)
          .whereNull('seasonId')
          .whereNull('episodeId')
          .innerJoin('list', (qb) =>
            qb.on('listItem.listId', 'list.id').onVal('list.isWatchlist', true)
          )
      );

      await trx.batchInsert(
        'notificationsHistory',
        pastReleasedMediaItems.map((item) => ({
          mediaItemId: item.id,
          episodeId: null,
          sendDate: currentTimestamp,
        }))
      );

      return {
        pastReleasedMediaItems,
        seenHistory,
        usersToSend,
      };
    });

  const seenHistoryByUserId = _(seenHistory)
    .groupBy((item) => item.userId)
    .mapValues((seen) => new Set(seen.map((item) => item.episodeId)))
    .value();

  const mediaItemUserMap = _(usersToSend)
    .groupBy((item) => item.mediaItemId)
    .mapValues((item) =>
      _(item)
        .map((subItem) => subItem.userId)
        .uniq()
        .value()
    )
    .value();

  const mediaItems = pastReleasedMediaItems
    .filter((mediaItem) => is(mediaItem.releaseDate))
    .map((mediaItem) => ({
      mediaItem,
      usersToSend: (mediaItemUserMap[mediaItem.id] || []).filter(
        (userId) => !seenHistoryByUserId[userId]?.has(mediaItem.id)
      ),
    }))
    .filter((item) => item.usersToSend.length > 0);

  if (mediaItems.length === 0) {
    return;
  }

  logger.debug(h`sending notifications for ${mediaItems.length} mediaItems`);

  await Promise.all(
    mediaItems.flatMap((item) =>
      item.usersToSend.map(async (userId: number) => {
        sendNotification({
          ...item,
          user: await userRepository.get({ userId }),
        });
      })
    )
  );
};

const sendNotificationsForTvShows = async () => {
  const { pastReleasedEpisodes, seenHistory, tvShows, usersToSend } =
    await Database.knex.transaction(async (trx) => {
      const currentTimestamp = Date.now();

      const pastReleasedEpisodes = await trx('episode')
        .select<EpisodeModel[]>('episode.*')
        .whereBetween('releaseDate', [
          formatISO(subHours(currentTimestamp, 24)),
          formatISO(currentTimestamp),
        ])
        .leftJoin(
          'notificationsHistory',
          'notificationsHistory.episodeId',
          'episode.id'
        )
        .whereNull('notificationsHistory.id');

      const tvShows = await trx('mediaItem').whereIn(
        'id',
        _(pastReleasedEpisodes)
          .map((episode) => episode.tvShowId)
          .uniq()
          .value()
      );

      const episodeIds = _(pastReleasedEpisodes)
        .map((episode) => episode.id)
        .uniq()
        .value();

      const tvShowIds = _(pastReleasedEpisodes)
        .map((item) => item.tvShowId)
        .uniq()
        .value();

      const seenHistory = await splitWhereInQuery(episodeIds, (chunk) =>
        trx('seen').whereIn('episodeId', chunk)
      );

      const usersToSend = await splitWhereInQuery(tvShowIds, (chunk) =>
        trx('listItem')
          .select<{ userId: number; mediaItemId: number }[]>(
            'list.userId',
            'mediaItemId'
          )
          .whereIn('mediaItemId', chunk)
          .whereNull('seasonId')
          .whereNull('episodeId')
          .innerJoin('list', (qb) =>
            qb.on('listItem.listId', 'list.id').onVal('list.isWatchlist', true)
          )
      );

      await trx.batchInsert(
        'notificationsHistory',
        pastReleasedEpisodes.map((item) => ({
          mediaItemId: item.tvShowId,
          episodeId: item.id,
          sendDate: currentTimestamp,
        }))
      );

      return { pastReleasedEpisodes, tvShows, seenHistory, usersToSend };
    });

  const getTvShow = (tvShowId: number) => {
    const res = tvShows.find((mediaItem) => mediaItem.id === tvShowId);

    if (!res) {
      throw new Error(`unable to find mediaItem ${tvShowId}`);
    }

    return res;
  };

  const seenHistoryByUserId = _(seenHistory)
    .groupBy((item) => item.userId)
    .mapValues((seen) => new Set(seen.map((item) => item.episodeId)))
    .value();

  const mediaItemUserMap = _(usersToSend)
    .groupBy((item) => item.mediaItemId)
    .mapValues((item) =>
      _(item)
        .map((subItem) => subItem.userId)
        .uniq()
        .value()
    )
    .value();

  const groupedEpisodes = _(pastReleasedEpisodes)
    .filter(withDefinedPropertyFactory('releaseDate'))
    .groupBy((episode) => episode.releaseDate)
    .mapValues((episodes) =>
      _(episodes)
        .groupBy((episode) => episode.tvShowId)
        .mapValues((episodes) => ({
          releaseDate: new Date(episodes[0].releaseDate),
          mediaItem: getTvShow(episodes[0].tvShowId),
          episodes,
          usersToSend: (mediaItemUserMap[episodes[0].tvShowId] || []).filter(
            (userId) => {
              const userSeenHistory = seenHistoryByUserId[userId];

              if (!userSeenHistory) {
                return true;
              }

              return (
                episodes.filter((episode) => userSeenHistory.has(episode.id))
                  .length !== episodes.length
              );
            }
          ),
        }))
        .values()
        .value()
    )
    .values()
    .flatten()
    .sortBy(({ releaseDate }) => releaseDate)
    .filter((item) => item.usersToSend.length > 0)
    .value();

  if (groupedEpisodes.length === 0) {
    return;
  }

  logger.debug(
    h`sending notifications for released episodes for ${groupedEpisodes.length} tv shows`
  );

  await Promise.all(
    groupedEpisodes.flatMap((item) =>
      item.usersToSend.map(async (userId: number) => {
        sendNotification({
          ...item,
          user: await userRepository.get({ userId }),
        });
      })
    )
  );
};
