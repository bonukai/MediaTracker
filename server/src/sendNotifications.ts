import _ from 'lodash';
import chalk from 'chalk';
import { addHours, parseISO, subHours } from 'date-fns';
import { plural, t } from '@lingui/macro';

import { MediaItemBase } from 'src/entity/mediaItem';
import { mediaItemRepository } from 'src/repository/mediaItem';
import { notificationsHistoryRepository } from 'src/repository/notificationsHistory';
import { userRepository } from 'src/repository/user';
import { TvEpisode } from 'src/entity/tvepisode';
import { User } from 'src/entity/user';
import { Notifications } from 'src/notifications/notifications';
import { notificationPlatformsCredentialsRepository } from 'src/repository/notificationPlatformsCredentials';
import { createLock } from 'src/lock';
import { logger } from 'src/logger';
import {
  FormattedNotification,
  formatNotification,
} from 'src/notifications/notificationFormatter';

const notificationForPastItems = async () => {
  const releasedItems = await mediaItemRepository.itemsToNotify(
    subHours(new Date(), 24),
    new Date()
  );

  for (const mediaItem of releasedItems) {
    await sendNotificationForMediaItem(mediaItem);
  }
};

const notificationForFutureItems = async () => {
  const releasedItems = await mediaItemRepository.itemsToNotify(
    new Date(),
    addHours(new Date(), 1)
  );

  for (const mediaItem of releasedItems) {
    const releaseDate = parseISO(mediaItem.releaseDate);

    addFutureNotification(
      async () =>
        (await checkIfNotificationHasBeenSent(mediaItem)) &&
        (await sendNotificationForMediaItem(mediaItem)),
      releaseDate
    );

    logger.debug(
      `Scheduled notification for release date of "${
        mediaItem.title
      }" at ${releaseDate.toUTCString()}`
    );
  }
};

const notificationForPastEpisodes = async () => {
  const releasedEpisodes = await mediaItemRepository.episodesToNotify(
    subHours(new Date(), 24),
    new Date()
  );

  const grouped = _.groupBy(releasedEpisodes, (episode) => episode.tvShowId);

  for (const episodes of Object.values(grouped)) {
    if (episodes.length === 0) {
      continue;
    }

    await sendNotificationForEpisodes(episodes);
  }
};

const notificationForFutureEpisodes = async () => {
  const futureEpisodes = await mediaItemRepository.episodesToNotify(
    new Date(),
    addHours(new Date(), 1)
  );

  const groupedByTvShowAndDate = _(futureEpisodes)
    .groupBy((episode) => episode.releaseDate)
    .mapValues((value) => _.groupBy(value, (episode) => episode.tvShowId))
    .value();

  for (const groupedByReleaseDate of Object.values(groupedByTvShowAndDate)) {
    for (const groupedByTvShow of Object.values(groupedByReleaseDate)) {
      if (groupedByTvShow.length === 0) {
        continue;
      }

      const episode = groupedByTvShow[0];
      const releaseDate = parseISO(episode.releaseDate);

      addFutureNotification(
        async () =>
          sendNotificationForEpisodes(
            await Promise.all(
              groupedByTvShow.filter(checkIfNotificationHasBeenSent)
            )
          ),
        releaseDate
      );

      logger.debug(
        `Scheduled notification for release date of episode "${
          episode.tvShow.title
        }" at ${releaseDate.toUTCString()}`
      );
    }
  }
};

const checkIfNotificationHasBeenSent = async (
  arg: TvEpisode | MediaItemBase
) => {
  return (
    (await notificationsHistoryRepository.findOne(
      'tvShowId' in arg
        ? {
            mediaItemId: arg.tvShowId,
            episodeId: arg.id,
          }
        : { mediaItemId: arg.id }
    )) != null
  );
};

const sendNotificationForEpisodes = async (episodes: TvEpisode[]) => {
  if (episodes.length === 0) {
    return;
  }

  const tvShow = episodes[0].tvShow;

  const usersToNotify = await userRepository.findUsersWithMediaItemOnWatchlist({
    mediaItemId: tvShow.id,
    sendNotificationForEpisodesReleases: true,
  });

  const title = tvShow.title;
  {
    const count = usersToNotify.length;

    logger.info(
      plural(count, {
        one: `Sending notification for new episodes of ${title} to # user`,
        other: `Sending notification for new episodes of ${title} to # users`,
      })
    );
  }

  const count = episodes.length;

  const notificationMessage = formatNotification((f) =>
    plural(count, {
      one: `# episode of ${f.mediaItemUrl(tvShow)} has been released`,
      other: `# episodes of ${f.mediaItemUrl(tvShow)} has been released`,
    })
  );

  await sendNotificationForItem({
    mediaItem: tvShow,
    episodes: episodes,
    notificationMessage: notificationMessage,
    users: usersToNotify,
  });
};

const sendNotificationForMediaItem = async (mediaItem: MediaItemBase) => {
  const title = mediaItem.title;
  const usersToNotify = await userRepository.findUsersWithMediaItemOnWatchlist({
    mediaItemId: mediaItem.id,
    sendNotificationForReleases: true,
  });

  const count = usersToNotify.length;

  logger.info(
    plural(count, {
      one: `Sending notification for ${title} to # user`,
      other: `Sending notification for ${title} to # users`,
    })
  );

  await sendNotificationForItem({
    mediaItem: mediaItem,
    notificationMessage: formatNotification(
      (f) => t`${f.mediaItemUrl(mediaItem)} has been released`
    ),
    users: usersToNotify,
  });
};

const sendNotificationForItem = async (args: {
  mediaItem: MediaItemBase;
  episodes?: TvEpisode[];
  users: User[];
  notificationMessage: FormattedNotification;
}) => {
  const { mediaItem, episodes, users, notificationMessage } = args;

  for (const user of users) {
    const platform = user.notificationPlatform;
    const credentials = await notificationPlatformsCredentialsRepository.get(
      user.id
    );

    await Notifications.sendNotification(platform, {
      message: notificationMessage,
      credentials: credentials[platform],
    });
  }

  if (episodes) {
    await notificationsHistoryRepository.createMany(
      episodes.map((episode) => ({
        mediaItemId: mediaItem.id,
        episodeId: episode.id,
        sendDate: new Date().getTime(),
      }))
    );
  } else {
    await notificationsHistoryRepository.create({
      mediaItemId: mediaItem.id,
      sendDate: new Date().getTime(),
    });
  }
};

const errorHandler = async (fn: () => Promise<void>) => {
  try {
    await fn();
  } catch (error) {
    logger.error(chalk.bold.red(t`Error sending notifications: ${error}`));
  }
};

const addFutureNotification = (fn: () => Promise<void>, date: Date) => {
  setTimeout(() => errorHandler(fn), date.getTime() - new Date().getTime());
};

export const sendNotifications = createLock(async () => {
  await errorHandler(async () => {
    await notificationForPastItems();
    await notificationForFutureItems();
    await notificationForPastEpisodes();
    await notificationForFutureEpisodes();
  });
});
