import {
  isSameDay,
  add,
  formatDuration,
  startOfTomorrow,
  formatISO,
  sub,
} from 'date-fns';
import _ from 'lodash';

import {
  MediaItemModel,
  ExternalIdNames,
  MediaType,
} from './entity/mediaItemModel.js';
import { logger } from './logger.js';
import { MetadataProvider } from './metadata/metadataProvider.js';
import { serverInternalSettingsRepository } from './repository/serverInternalSettingsRepository.js';
import { scheduleJob } from './scheduler.js';
import { updateMetadata } from './updateMetadata.js';
import { h, is, sequentialPromise, splitWhereInQuery } from './utils.js';
import { Database } from './database.js';
import { TmdbTv } from './metadata/provider/tmdbTv.js';
import { TmdbMovie } from './metadata/provider/tmdbMovie.js';
import { metadataProviders } from './metadata/metadataProviders.js';

const updateMediaItemsAndLog = async (mediaItems: MediaItemModel[]) => {
  logger.debug(h`updating ${mediaItems.length} items`);

  const updatedResult = await sequentialPromise(
    mediaItems,
    async (mediaItem) => {
      try {
        await updateMetadata(mediaItem);
      } catch (error) {
        logger.error(error);
        return mediaItem;
      }
    }
  );

  const failedUpdates = updatedResult.filter(is);
  const failedUpdatesCount = failedUpdates.length;

  if (failedUpdatesCount === 0) {
    logger.debug(h`updated all ${mediaItems.length} items`);
  } else {
    logger.error(
      h`failed to update ${failedUpdatesCount} items:  ${failedUpdates
        .map((item) => item.id)
        .join(', ')}`
    );
  }
};

const updateMetadataAndStartWatchingForChanges = async (args: {
  metadataProvider: MetadataProvider;
  idName: ExternalIdNames;
  maxTimeBetweenUpdates: Duration;
  updateTimeResolution: 'day';
}) => {
  const {
    metadataProvider,
    idName,
    maxTimeBetweenUpdates,
    updateTimeResolution,
  } = args;
  const mediaType = metadataProvider.mediaType;

  if (typeof metadataProvider.idsOfItemsToUpdate !== 'function') {
    return;
  }

  const internalSettings = await serverInternalSettingsRepository.get();

  const previousUpdateTime = internalSettings.previousTimesForChangesCheck
    ? internalSettings.previousTimesForChangesCheck[mediaType]
    : undefined;

  const updateAllTvShows = async () => {
    const mediaItemsToUpdate = await Database.knex('mediaItem').where(
      'mediaType',
      mediaType
    );

    await updateMediaItemsAndLog(mediaItemsToUpdate);
  };

  const shouldSkipUpdate = (previousUpdateTime: Date): boolean => {
    switch (updateTimeResolution) {
      case 'day':
        if (isSameDay(previousUpdateTime, new Date())) {
          logger.debug(
            h`skipping ${mediaType} metadata update, it has already been updated today, at ${previousUpdateTime.toLocaleString()}`
          );
          return true;
        }
    }

    return false;
  };

  const endDate = new Date();

  if (!previousUpdateTime) {
    logger.debug(
      h`missing ${'previousTimeForChangesCheck'}, updating all media with type ${mediaType}`
    );
    await updateAllTvShows();
  } else if (add(previousUpdateTime, maxTimeBetweenUpdates) < new Date()) {
    logger.debug(
      h`${'previousTimeForChangesCheck'} is older then ${formatDuration(
        maxTimeBetweenUpdates
      )}, updating all media with type ${mediaType}`
    );
    await updateAllTvShows();
  } else {
    if (!shouldSkipUpdate(previousUpdateTime)) {
      const ids = await metadataProvider.idsOfItemsToUpdate({
        startDate: previousUpdateTime,
        endDate,
      });

      const mediaItemsToUpdate = await splitWhereInQuery(ids, (chunk) =>
        Database.knex('mediaItem')
          .whereIn(idName, chunk)
          .where('mediaType', mediaType)
      );

      if (mediaItemsToUpdate.length === 0) {
        logger.debug(`${mediaType} metadata up to date`);
      } else {
        logger.debug(
          h`updating ${mediaItemsToUpdate.length} media with type ${mediaType}`
        );

        await updateMediaItemsAndLog(mediaItemsToUpdate);
      }
    }
  }

  await serverInternalSettingsRepository.update({
    previousTimesForChangesCheck: {
      [mediaType]: endDate,
    },
  });

  scheduleJob({
    job: async () => {
      try {
        await updateMetadataAndStartWatchingForChanges(args);
      } catch (error) {
        logger.error(error);
      }
    },
    date: startOfTomorrow(),
    name: `${mediaType} metadata update`,
    behaviorOnDuplicateJob: 'override',
  });
};

const updateMetadataOfMediaType = async (args: {
  mediaType: MediaType;
  frequencyForReleasedItems: Duration | 'never';
  frequencyForUnreleasedItems: Duration | 'never';
}) => {
  const { mediaType, frequencyForReleasedItems, frequencyForUnreleasedItems } =
    args;

  if (
    frequencyForReleasedItems === 'never' &&
    frequencyForUnreleasedItems === 'never'
  ) {
    logger.debug(h`not updating metadata for any ${mediaType} as per policy`);
    return;
  }

  const currentDateString = formatISO(new Date());

  const itemsToUpdate = await Database.knex.transaction(async (trx) => {
    const releasedItemsToUpdate =
      frequencyForReleasedItems === 'never'
        ? []
        : await trx('mediaItem')
            .where('mediaType', mediaType)
            .where('releaseDate', '<=', currentDateString)
            .where(
              'lastTimeUpdated',
              '<',
              sub(new Date(), frequencyForReleasedItems).getTime()
            );

    const unreleasedItemsToUpdate =
      frequencyForUnreleasedItems === 'never'
        ? []
        : await trx('mediaItem')
            .where('mediaType', mediaType)
            .where('releaseDate', '>', currentDateString)
            .where(
              'lastTimeUpdated',
              '<',
              sub(new Date(), frequencyForUnreleasedItems).getTime()
            );

    return [...releasedItemsToUpdate, ...unreleasedItemsToUpdate];
  });

  const itemsThatCanBeUpdated = itemsToUpdate.filter((mediaItem) =>
    metadataProviders.getForMediaType(mediaItem)
  );

  if (itemsThatCanBeUpdated.length > 0) {
    await updateMediaItemsAndLog(
      _(itemsThatCanBeUpdated)
        .uniqBy((item) => item.id)
        .sortBy((item) => item.id)
        .value()
    );
  } else {
    logger.debug(h`metadata for ${mediaType} is up to date`);
  }
};

export const startUpdaterForAllMediaItems = async () => {
  await updateMetadataAndStartWatchingForChanges({
    metadataProvider: TmdbTv,
    idName: 'tmdbId',
    maxTimeBetweenUpdates: {
      days: 14,
    },
    updateTimeResolution: 'day',
  });

  await updateMetadataAndStartWatchingForChanges({
    metadataProvider: TmdbMovie,
    idName: 'tmdbId',
    maxTimeBetweenUpdates: {
      days: 14,
    },
    updateTimeResolution: 'day',
  });

  const updateOtherItems = async () => {
    await updateMetadataOfMediaType({
      mediaType: 'audiobook',
      frequencyForReleasedItems: 'never',
      frequencyForUnreleasedItems: { days: 30 },
    });

    await updateMetadataOfMediaType({
      mediaType: 'book',
      frequencyForReleasedItems: 'never',
      frequencyForUnreleasedItems: { days: 30 },
    });

    await updateMetadataOfMediaType({
      mediaType: 'video_game',
      frequencyForReleasedItems: 'never',
      frequencyForUnreleasedItems: { days: 30 },
    });
  };

  const updateOtherItemsAndSchedule = async () => {
    await updateOtherItems();

    scheduleJob({
      date: add(new Date(), { hours: 24 }),
      name: 'update all metadata',
      behaviorOnDuplicateJob: 'override',
      job: updateOtherItemsAndSchedule,
    });
  };

  updateOtherItemsAndSchedule();
};
