import _ from 'lodash';
import chalk from 'chalk';
import { addHours, subHours } from 'date-fns';
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
    addFutureNotification(
      async () =>
        (await checkIfNotificationHasBeenSent(mediaItem)) &&
        (await sendNotificationForMediaItem(mediaItem)),
      new Date(mediaItem.releaseDate)
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

      addFutureNotification(
        async () =>
          sendNotificationForEpisodes(
            await Promise.all(
              groupedByTvShow.filter(checkIfNotificationHasBeenSent)
            )
          ),
        new Date(groupedByTvShow[0].releaseDate)
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

    console.log(
      plural(count, {
        one: `Sending notification for new episodes of ${title} to # user`,
        other: `Sending notification for new episodes of ${title} to # users`,
      })
    );
  }

  const count = episodes.length;

  const notificationMessage = plural(count, {
    one: `# episode for **${title}** has been released`,
    other: `# episodes for **${title}** has been released`,
  });

  await sendNotificationForItem({
    mediaItem: tvShow,
    episodes: episodes,
    notificationMessage: notificationMessage,
    users: usersToNotify,
  });
};

const sendNotificationForMediaItem = async (mediaItem: MediaItemBase) => {
  const title = mediaItem.title;
  const notificationMessage = t`${title} has been released`;

  const usersToNotify = await userRepository.findUsersWithMediaItemOnWatchlist({
    mediaItemId: mediaItem.id,
    sendNotificationForReleases: true,
  });

  const count = usersToNotify.length;

  console.log(
    plural(count, {
      one: `Sending notification for ${title} to # user`,
      other: `Sending notification for ${title} to # users`,
    })
  );

  await sendNotificationForItem({
    mediaItem: mediaItem,
    notificationMessage: notificationMessage,
    users: usersToNotify,
  });
};

const sendNotificationForItem = async (args: {
  mediaItem: MediaItemBase;
  episodes?: TvEpisode[];
  users: User[];
  notificationMessage: string;
}) => {
  const { mediaItem, episodes, users, notificationMessage } = args;
  const notificationTitle = 'MediaTracker';

  for (const user of users) {
    const platform = user.notificationPlatform;
    const credentials = await notificationPlatformsCredentialsRepository.get(
      user.id
    );

    await Notifications.sendNotification(platform, {
      title: notificationTitle,
      message: notificationMessage,
      messageMarkdown: notificationMessage,
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
    console.log(chalk.bold.red(t`Error sending notifications: ${error}`));
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
