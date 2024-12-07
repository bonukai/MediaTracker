import { Database } from './database.js';
import { logger } from './logger.js';
import { mediaItemRepository } from './repository/mediaItemRepository.js';
import { scheduleJob } from './scheduler.js';
import { h } from './utils.js';

export const scheduleLastAndUpcomingAiringsUpdate = async () => {
  const currentDateString = new Date().toISOString();

  await Database.knex.transaction(async (trx) => {
    const nextEpisodeReleaseDate = await trx('episode')
      .min({
        releaseDate: 'releaseDate',
      })
      .where('releaseDate', '>', currentDateString)
      .first();

    if (!nextEpisodeReleaseDate || !nextEpisodeReleaseDate.releaseDate) {
      return;
    }

    const date = new Date(nextEpisodeReleaseDate.releaseDate);

    if (isNaN(date.getTime())) {
      return;
    }

    const upcomingEpisodes = await trx('episode').where(
      'releaseDate',
      nextEpisodeReleaseDate.releaseDate
    );

    const mediaItemsToUpdate = upcomingEpisodes.map(
      (episode) => episode.tvShowId
    );

    scheduleJob({
      name: 'update next and upcoming episodes',
      date,
      job: async () => {
        if (mediaItemsToUpdate.length === 0) {
          logger.debug(h`nothing to update`);
        } else {
          await Database.knex.transaction((trx) =>
            mediaItemRepository.updateLastAndUpcomingEpisodeAirings({
              mediaItemIds: mediaItemsToUpdate,
              trx,
            })
          );

          logger.debug(
            h`updated last and upcoming episodes for ${mediaItemsToUpdate.length} shows: ${mediaItemsToUpdate.join(', ')}`
          );
        }

        await scheduleLastAndUpcomingAiringsUpdate();
      },
    });
  });

  await Database.knex.transaction(async (trx) => {
    const nextMediaItemReleaseDate = await trx('mediaItem')
      .min({
        releaseDate: 'releaseDate',
      })
      .where('releaseDate', '>', currentDateString)
      .first();

    if (!nextMediaItemReleaseDate || !nextMediaItemReleaseDate.releaseDate) {
      return;
    }

    const date = new Date(nextMediaItemReleaseDate.releaseDate);

    if (isNaN(date.getTime())) {
      return;
    }

    const upcomingMediaItems = await trx('mediaItem').where(
      'releaseDate',
      nextMediaItemReleaseDate.releaseDate
    );

    const mediaItemsToUpdate = upcomingMediaItems.map(
      (mediaItem) => mediaItem.id
    );

    scheduleJob({
      name: 'update next and upcoming media items',
      date,
      job: async () => {
        if (mediaItemsToUpdate.length === 0) {
          logger.debug(h`nothing to update`);
        } else {
          await Database.knex.transaction((trx) =>
            mediaItemRepository.updateLastAndNextMediaItemAirings({
              mediaItemIds: mediaItemsToUpdate,
              trx,
            })
          );

          logger.debug(
            h`updated last and upcoming dates for ${mediaItemsToUpdate.length} mediaItems: ${mediaItemsToUpdate.join(', ')}`
          );
        }

        await scheduleLastAndUpcomingAiringsUpdate();
      },
    });
  });
};
