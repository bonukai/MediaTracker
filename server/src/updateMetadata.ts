import _ from 'lodash';
import chalk from 'chalk';
import { plural, t } from '@lingui/macro';
import { parseISO } from 'date-fns';

import {
  MediaItemBase,
  MediaItemBaseWithSeasons,
  MediaItemForProvider,
} from 'src/entity/mediaItem';
import { TvEpisode } from 'src/entity/tvepisode';
import { TvSeason, TvSeasonFilters } from 'src/entity/tvseason';
import { metadataProviders } from 'src/metadata/metadataProviders';
import { mediaItemRepository } from 'src/repository/mediaItem';
import { durationToMilliseconds, updateAsset } from 'src/utils';
import { Notifications } from 'src/notifications/notifications';
import { userRepository } from 'src/repository/user';
import { User } from 'src/entity/user';
import { CancellationToken } from 'src/cancellationToken';
import { createLock } from 'src/lock';
import { logger } from 'src/logger';
import { Database } from 'src/dbconfig';
import {
  FormattedNotification,
  formatNotification,
} from 'src/notifications/notificationFormatter';


const getItemsToDelete = (
  oldMediaItem: MediaItemBaseWithSeasons,
  updatedMediaItem: MediaItemBaseWithSeasons
): [Array<TvEpisode>, Array<TvSeason>] => {
  const oldSeasonsMap = _.keyBy(
    oldMediaItem.seasons,
    (season) => season.seasonNumber
  );

  const newSeasonsMap = _.keyBy(
    updatedMediaItem.seasons,
    (season) => season.seasonNumber
  );

  const oldSeasons = oldMediaItem.seasons?.map((season) => season.seasonNumber);
  const newSeasons = updatedMediaItem.seasons?.map(
    (season) => season.seasonNumber
  );

  const seasonNumbersToDelete = _.difference(oldSeasons, newSeasons);
  const seasonToDelete = seasonNumbersToDelete.map(
    (seasonNumber) => oldSeasonsMap[seasonNumber]
  );

  const episodesToDelete = oldMediaItem.seasons?.flatMap((season) => {
    const episodesMap = _.keyBy(
      oldSeasonsMap[season.seasonNumber]?.episodes,
      (episode) => episode.episodeNumber
    );

    const oldEpisodes = season?.episodes?.map(
      (episode) => episode.episodeNumber
    );
    const newEpisodes = newSeasonsMap[season.seasonNumber]?.episodes?.map(
      (episode) => episode.episodeNumber
    );

    const episodesNumbersToDelete = _.difference(oldEpisodes, newEpisodes);

    return episodesNumbersToDelete.map(
      (episodeNumber) => episodesMap[episodeNumber]
    );
  });

  return [episodesToDelete, seasonToDelete];
};

const merge = (
  oldMediaItem: MediaItemBaseWithSeasons,
  newMediaItem: MediaItemForProvider
): MediaItemBaseWithSeasons => {
  const seasonsMap = _.keyBy(
    oldMediaItem.seasons,
    (season) => season.seasonNumber
  );

  const mediaItemId = oldMediaItem.id;

  return {
    ...newMediaItem,
    lastTimeUpdated: new Date().getTime(),
    id: mediaItemId,
    seasons: newMediaItem.seasons?.map((season) => {
      const seasonId = seasonsMap[season.seasonNumber]?.id;

      const episodesMap = _.keyBy(
        seasonsMap[season.seasonNumber]?.episodes,
        (episode) => episode.episodeNumber
      );

      return {
        ...season,
        id: seasonId,
        tvShowId: mediaItemId,
        episodes: season.episodes?.map((episode) => ({
          ...episode,
          id: episodesMap[episode.episodeNumber]?.id,
          tvShowId: mediaItemId,
          seasonId: seasonId,
        })),
      };
    }),
  };
};

const downloadNewAssets = async (
  oldMediaItem: MediaItemBaseWithSeasons,
  newMediaItem: MediaItemBaseWithSeasons
) => {
  if (newMediaItem.poster && newMediaItem.poster !== oldMediaItem.poster) {
    await updateAsset({
      type: 'poster',
      mediaItemId: oldMediaItem.id,
      url: newMediaItem.poster,
    });
  }

  if (
    newMediaItem.backdrop &&
    newMediaItem.backdrop !== oldMediaItem.backdrop
  ) {
    await updateAsset({
      type: 'backdrop',
      mediaItemId: oldMediaItem.id,
      url: newMediaItem.backdrop,
    });
  }

  const newSeasonsMap = _.keyBy(
    newMediaItem.seasons,
    (season) => season.seasonNumber
  );

  await Promise.all(
    newMediaItem.seasons
      ?.filter((season) => season.poster)
      ?.filter(
        (season) =>
          season.id && season.poster !== newSeasonsMap[season.id]?.poster
      )
      .map((season) =>
        updateAsset({
          type: 'poster',
          mediaItemId: oldMediaItem.id,
          seasonId: season.id,
          url: season.poster,
        })
      ) || []
  );
};

const sendNotifications = async (
  oldMediaItem: MediaItemBaseWithSeasons,
  newMediaItem: MediaItemBaseWithSeasons
) => {
  const users = await userRepository.usersWithMediaItemOnWatchlist(
    oldMediaItem.id
  );

  const send = async (args: {
    message: FormattedNotification;
    filter: (user: User) => boolean;
  }) => {
    await Promise.all(
      users.filter(args.filter).map((user) =>
        Notifications.send({
          userId: user.id,
          message: args.message,
        })
      )
    );
  };

  if (
    newMediaItem.status !== oldMediaItem.status &&
    !(!newMediaItem.status && !oldMediaItem.status)
  ) {
    const status = newMediaItem.status;

    await send({
      message: formatNotification(
        (f) =>
          t`Status changed for ${f.mediaItemUrl(newMediaItem)}: "${status}"`
      ),
      filter: (user) => user.sendNotificationWhenStatusChanges,
    });
  }

  if (
    newMediaItem.releaseDate !== oldMediaItem.releaseDate &&
    parseISO(newMediaItem.releaseDate) > new Date()
  ) {
    const releaseDate = newMediaItem.releaseDate;

    await send({
      message: formatNotification(
        (f) =>
          t`Release date changed for ${f.mediaItemUrl(
            newMediaItem
          )}: "${releaseDate}"`
      ),
      filter: (user) => user.sendNotificationWhenReleaseDateChanges,
    });
  }

  if (newMediaItem.mediaType === 'tv') {
    const oldMediaItemNonSpecialSeasons = oldMediaItem.seasons
      .filter(TvSeasonFilters.nonSpecialSeason)
      .sort(TvSeasonFilters.seasonNumber);
    const newMediaItemNonSpecialSeasons = newMediaItem.seasons
      .filter(TvSeasonFilters.nonSpecialSeason)
      .sort(TvSeasonFilters.seasonNumber);

    if (
      newMediaItemNonSpecialSeasons.length <
      oldMediaItemNonSpecialSeasons.length
    ) {
      const removedSeason =
        oldMediaItemNonSpecialSeasons[
          oldMediaItemNonSpecialSeasons.length +
            newMediaItemNonSpecialSeasons.length -
            oldMediaItemNonSpecialSeasons.length -
            1
        ];

      const seasonNumber = removedSeason.seasonNumber;

      await send({
        message: formatNotification(
          (f) =>
            t`Season ${seasonNumber} of ${f.mediaItemUrl(
              newMediaItem
            )} has been canceled`
        ),
        filter: (user) => user.sendNotificationWhenNumberOfSeasonsChanges,
      });
    } else if (
      newMediaItemNonSpecialSeasons.length >
      oldMediaItemNonSpecialSeasons.length
    ) {
      const newSeason =
        newMediaItemNonSpecialSeasons[
          oldMediaItemNonSpecialSeasons.length +
            newMediaItemNonSpecialSeasons.length -
            oldMediaItemNonSpecialSeasons.length -
            1
        ];

      if (newSeason.releaseDate) {
        if (parseISO(newSeason.releaseDate) > new Date()) {
          const releaseDate = parseISO(
            newSeason.releaseDate
          ).toLocaleDateString();

          await send({
            message: formatNotification(
              (f) =>
                t`New season of ${f.mediaItemUrl(
                  newMediaItem
                )} will be released at ${releaseDate}`
            ),
            filter: (user) => user.sendNotificationWhenNumberOfSeasonsChanges,
          });
        }
      } else {
        await send({
          message: formatNotification(
            (f) => t`${f.mediaItemUrl(newMediaItem)} got a new season`
          ),

          filter: (user) => user.sendNotificationWhenNumberOfSeasonsChanges,
        });
      }
    } else if (oldMediaItemNonSpecialSeasons.length > 0) {
      const oldMediaItemLastSeason =
        oldMediaItemNonSpecialSeasons[oldMediaItemNonSpecialSeasons.length - 1];
      const newMediaItemLastSeason =
        newMediaItemNonSpecialSeasons[newMediaItemNonSpecialSeasons.length - 1];

      if (
        oldMediaItemLastSeason.releaseDate !==
          newMediaItemLastSeason.releaseDate &&
        parseISO(newMediaItemLastSeason.releaseDate) > new Date()
      ) {
        const seasonNumber = newMediaItemLastSeason.seasonNumber;
        const releaseDate = parseISO(
          newMediaItemLastSeason.releaseDate
        ).toLocaleDateString();

        await send({
          message: formatNotification(
            (f) =>
              t`Season ${seasonNumber} of ${f.mediaItemUrl(
                newMediaItem
              )} will be released at ${releaseDate}`
          ),
          filter: (user) => user.sendNotificationWhenNumberOfSeasonsChanges,
        });
      }
    }
  }
};

export const updateMediaItem = async (
  oldMediaItem?: MediaItemBaseWithSeasons
) => {
  const title = oldMediaItem.title;

  if (oldMediaItem.lastTimeUpdated) {
    const date = chalk.blue(
      new Date(oldMediaItem.lastTimeUpdated).toLocaleString()
    );

    logger.info(t`Updating: ${title} (last updated at: ${date})`);
  } else {
    logger.info(t`Updating: ${title}`);
  }

  if (!oldMediaItem) {
    return;
  }

  await mediaItemRepository.lock(oldMediaItem.id);

  try {
    const metadataProvider = metadataProviders.get(
      oldMediaItem.mediaType,
      oldMediaItem.source
    );

    if (!metadataProvider) {
      throw new Error(
        `No metadata provider "${oldMediaItem.source}" for media type ${oldMediaItem.mediaType}`
      );
    }

    const newMediaItem = await metadataProvider.details(oldMediaItem);

    if (!newMediaItem) {
      throw new Error('No metadata');
    }

    const updatedMediaItem =
      newMediaItem.mediaType === 'tv'
        ? await margeTvShow(oldMediaItem, newMediaItem)
        : {
            ...newMediaItem,
            lastTimeUpdated: new Date().getTime(),
            id: oldMediaItem.id,
          };

    if (updatedMediaItem) {
      await mediaItemRepository.update(updatedMediaItem);

      await downloadNewAssets(oldMediaItem, updatedMediaItem);

      if (!oldMediaItem.needsDetails) {
        await sendNotifications(oldMediaItem, updatedMediaItem);
      }
    }

    await mediaItemRepository.unlock(oldMediaItem.id);
    return updatedMediaItem;
  } catch (error) {
    await mediaItemRepository.unlock(oldMediaItem.id);
    throw error;
  }
};

const shouldUpdate = (mediaItem: MediaItemBase) => {
  const timePassed = new Date().getTime() - mediaItem.lastTimeUpdated;

  if (
    mediaItem.mediaType !== 'tv' &&
    mediaItem.releaseDate &&
    parseISO(mediaItem.releaseDate) < new Date() &&
    parseISO(mediaItem.releaseDate) < new Date(mediaItem.lastTimeUpdated)
  ) {
    return (
      timePassed >=
      durationToMilliseconds({
        days: 30,
      })
    );
  }

  return timePassed >= durationToMilliseconds({ hours: 24 });
};

const margeTvShow = async (
  oldMediaItem: MediaItemBase,
  newMediaItem: MediaItemForProvider
) => {
  const oldMediaItemWithSeason = {
    ...oldMediaItem,
    seasons: await mediaItemRepository.seasonsWithEpisodes(oldMediaItem),
  };
  const updatedMediaItem = merge(oldMediaItemWithSeason, newMediaItem);

  const [episodesToDelete, seasonsToDelete] = getItemsToDelete(
    oldMediaItemWithSeason,
    updatedMediaItem
  );

  if (episodesToDelete.length > 0) {
    logger.info(
      `Local database has episodes not present in the external source. Attempting to remove local episodes: ${episodesToDelete
        .map(
          (episode) =>
            `${episode.seasonNumber}x${episode.episodeNumber} "${episode.title}"`
        )
        .join(', ')}`
    );
  }

  if (seasonsToDelete.length > 0) {
    logger.info(
      `Local database has seasons not present in the external source. Attempting to remove local seasons: ${seasonsToDelete
        .map((season) => `${season.seasonNumber} "${season.title}"`)
        .join(', ')}`
    );
  }

  if (episodesToDelete.length > 0 || seasonsToDelete.length > 0) {
    const episodesIdToDelete = [
      ...episodesToDelete.map((episode) => episode.id),
      ...seasonsToDelete.flatMap((season) =>
        season.episodes?.map((episode) => episode.id)
      ),
    ].filter(Boolean);

    const seasonsIdsToDelete = seasonsToDelete.map((season) => season.id);

    if (episodesIdToDelete.length > 0 || seasonsIdsToDelete.length > 0) {
      const res = await Database.knex.transaction(async (trx) => {
        if (episodesIdToDelete.length > 0) {
          const seen = await trx('seen').whereIn(
            'episodeId',
            episodesIdToDelete
          );

          if (seen.length > 0) {
            return {
              error: `failed to delete local episodes, there are seen entries with those episodes`,
            };
          }

          const progress = await trx('progress').whereIn(
            'episodeId',
            episodesIdToDelete
          );

          if (progress.length > 0) {
            return {
              error: `failed to delete local episodes, there are progress entries with those episodes`,
            };
          }

          const listItems = await trx('listItem').whereIn(
            'episodeId',
            episodesIdToDelete
          );

          if (listItems.length > 0) {
            return {
              error: `failed to delete local episodes, there are listItems with those episodes`,
            };
          }

          const userRating = await trx('userRating').whereIn(
            'episodeId',
            episodesIdToDelete
          );

          if (userRating.length > 0) {
            return {
              error: `failed to delete local episodes, there are userRating with those episodes`,
            };
          }

          await trx('seen').whereIn('episodeId', episodesIdToDelete).delete();
          await trx('progress')
            .whereIn('episodeId', episodesIdToDelete)
            .delete();

          await trx('listItem')
            .whereIn('episodeId', episodesIdToDelete)
            .delete();

          await trx('userRating')
            .whereIn('episodeId', episodesIdToDelete)
            .delete();

          await trx('notificationsHistory')
            .whereIn('episodeId', episodesIdToDelete)
            .delete();

          await trx('episode').whereIn('id', episodesIdToDelete).delete();
        }

        if (seasonsIdsToDelete.length > 0) {
          const listItems = await trx('listItem').whereIn(
            'seasonId',
            seasonsIdsToDelete
          );

          if (listItems.length > 0) {
            return {
              error: `failed to delete local seasons, there are listItems with those seasons`,
            };
          }

          const userRating = await trx('userRating').whereIn(
            'seasonId',
            seasonsIdsToDelete
          );

          if (userRating.length > 0) {
            return {
              error: `failed to delete local seasons, there are userRating with those seasons`,
            };
          }

          await trx('listItem')
            .whereIn('seasonId', seasonsIdsToDelete)
            .delete();

          await trx('userRating')
            .whereIn('seasonId', seasonsIdsToDelete)
            .delete();

          await trx('image').whereIn('seasonId', seasonsIdsToDelete).delete();

          await trx('season').whereIn('id', seasonsIdsToDelete).delete();
        }

        return true;
      });

      if (res === true) {
        logger.info(`deleted local episodes and seasons`);
      } else {
        logger.error(res.error);
        return;
      }
    }
  }

  return updatedMediaItem;
};

export const updateMediaItems = async (args: {
  mediaItems: MediaItemBaseWithSeasons[];
  cancellationToken?: CancellationToken;
  forceUpdate?: boolean;
}) => {
  const { mediaItems, cancellationToken, forceUpdate } = args;

  logger.info(
    chalk.bold.green(
      plural(mediaItems.length, {
        one: 'Updating metadata for # item',
        other: 'Updating metadata for # items',
      })
    )
  );

  let numberOfUpdatedItems = 0;
  let numberOfFailures = 0;

  for (const mediaItem of mediaItems) {
    if (cancellationToken?.shouldCancel) {
      logger.info(chalk.bold('Updating metadata canceled'));
      break;
    }

    const skip = forceUpdate ? false : !shouldUpdate(mediaItem);

    if (skip) {
      continue;
    }

    try {
      await updateMediaItem(mediaItem);
      numberOfUpdatedItems++;
    } catch (error) {
      logger.error(chalk.red(error.toString()));
      numberOfFailures++;
    }
  }

  if (numberOfUpdatedItems === 0 && numberOfFailures === 0) {
    logger.info(chalk.bold.green(t`Everything up to date`));
  } else {
    const count = numberOfUpdatedItems;

    logger.info(
      chalk.bold.green(
        plural(count, {
          one: 'Updated 1 item',
          other: 'Updated # items',
        })
      )
    );

    if (numberOfFailures > 0) {
      const count = numberOfFailures;

      logger.error(
        chalk.bold.red(
          plural(count, {
            one: 'Failed to update 1 item',
            other: 'Failed to update # items',
          })
        )
      );
    }
  }

  cancellationToken?.complected();
};

export const updateMetadata = createLock(async (): Promise<void> => {
  await mediaItemRepository.unlockLockedMediaItems();
  const mediaItems = await mediaItemRepository.itemsToPossiblyUpdate();
  await updateMediaItems({ mediaItems: mediaItems });
});
