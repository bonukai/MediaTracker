import { addDays } from 'date-fns';
import { Database } from './database.js';
import { logger } from './logger.js';
import { mediaItemRepository } from './repository/mediaItemRepository.js';
import { scheduleJob } from './scheduler.js';
import { h } from './utils.js';

export const scheduleLastAndUpcomingAiringsUpdate = async () => {
  const now = new Date();
  const endDate = addDays(now, 1);

  const currentDateString = now.toISOString();
  const endDateString = endDate.toISOString();

  const getEpisodesToUpdate = () => {
    return Database.knex.transaction(async (trx) => {
      const nextEpisodeReleaseDate = await trx('episode')
        .min({
          releaseDate: 'releaseDate',
        })
        .where('releaseDate', '>', currentDateString)
        .where('releaseDate', '<=', endDateString)
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

      if (mediaItemsToUpdate.length === 0) {
        return;
      }

      return { mediaItemsToUpdate, date };
    });
  };

  const episodesToUpdate = await getEpisodesToUpdate();

  scheduleJob({
    name: 'update next and upcoming episodes',
    date: episodesToUpdate ? episodesToUpdate.date : endDate,
    job: async () => {
      if (episodesToUpdate) {
        const { mediaItemsToUpdate } = episodesToUpdate;

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

  const getMediaItemsToUpdate = () => {
    return Database.knex.transaction(async (trx) => {
      const nextMediaItemReleaseDate = await trx('mediaItem')
        .min({
          releaseDate: 'releaseDate',
        })
        .where('releaseDate', '>', currentDateString)
        .where('releaseDate', '<=', endDateString)
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

      if (mediaItemsToUpdate.length === 0) {
        return;
      }

      return { mediaItemsToUpdate, date };
    });
  };

  const nonTvItemsToUpdate = await getMediaItemsToUpdate();

  scheduleJob({
    name: 'update next and upcoming media items',
    date: nonTvItemsToUpdate ? nonTvItemsToUpdate.date : endDate,
    job: async () => {
      if (nonTvItemsToUpdate) {
        const { mediaItemsToUpdate } = nonTvItemsToUpdate;

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
};
