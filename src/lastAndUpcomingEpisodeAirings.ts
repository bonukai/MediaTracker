import { Database } from './database.js';
import { logger } from './logger.js';
import { mediaItemRepository } from './repository/mediaItemRepository.js';
import { scheduleJob } from './scheduler.js';
import { h } from './utils.js';

export const scheduleLastAndUpcomingEpisodeAiringsUpdate = async () => {
  await Database.knex.transaction(async (trx) => {
    const nextEpisodeReleaseDate = await trx('episode')
      .min({
        releaseDate: 'releaseDate',
      })
      .where('releaseDate', '>', new Date().toISOString())
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
      date: new Date(nextEpisodeReleaseDate.releaseDate),
      job: async () => {
        if (mediaItemsToUpdate.length === 0) {
          logger.debug(h`nothing to update`);
        } else {
          await mediaItemRepository.updateLastAndUpcomingEpisodeAirings({
            mediaItemIds: mediaItemsToUpdate,
          });

          logger.debug(
            h`updated last and upcoming episodes for ${mediaItemsToUpdate.length} shows: ${mediaItemsToUpdate.join(', ')}`
          );
        }

        await scheduleLastAndUpcomingEpisodeAiringsUpdate();
      },
    });
  });
};
