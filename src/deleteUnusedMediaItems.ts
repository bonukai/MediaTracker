import _ from 'lodash';

import { Database } from './database.js';
import { MediaItemModel } from './entity/mediaItemModel.js';
import { logger } from './logger.js';
import { h, splitDeleteWhereInQuery } from './utils.js';

export const deleteUnusedMediaItems = async () => {
  // TODO: Add "lastViewedAt" column to mediaItem, and use it, to filter old mediaItems.
  // Consider scenario, where this function is run directly after user run search, and after deletion of all those search results, user clicks on the item, but it is not in the database
  // "lastViewedAt" should be updated in "search", "details", "listItems", "seen", "ratings"
  await Database.knex.transaction(async (trx) => {
    const unusedMediaItems = await trx('mediaItem')
      .select<MediaItemModel[]>('mediaItem.*')
      .leftJoin('seen', 'seen.mediaItemId', 'mediaItem.id')
      .whereNull('seen.id')
      .leftJoin('progress', 'progress.mediaItemId', 'mediaItem.id')
      .whereNull('progress.id')
      .leftJoin('listItem', 'listItem.mediaItemId', 'mediaItem.id')
      .whereNull('listItem.id')
      .leftJoin('userRating', 'userRating.mediaItemId', 'mediaItem.id')
      .whereNull('userRating.id');

    const mediaItemIds = _(unusedMediaItems)
      .map((item) => item.id)
      .uniq()
      .value();

    if (mediaItemIds.length === 0) {
      logger.debug(`no unused media items to delete`);
      return;
    }

    logger.debug(
      h`there are ${mediaItemIds.length} unused media items, attempting do delete them`
    );

    await splitDeleteWhereInQuery(mediaItemIds, (chunk) =>
      trx('mediaItem').whereIn('id', chunk).update({
        upcomingEpisodeId: null,
        lastAiredEpisodeId: null,
      })
    );

    await splitDeleteWhereInQuery(mediaItemIds, (chunk) =>
      trx('seenEpisodesCount').whereIn('mediaItemId', chunk).delete()
    );
    await splitDeleteWhereInQuery(mediaItemIds, (chunk) =>
      trx('notificationsHistory').whereIn('mediaItemId', chunk).delete()
    );
    await splitDeleteWhereInQuery(mediaItemIds, (chunk) =>
      trx('justWatchAvailability').whereIn('mediaItemId', chunk).delete()
    );
    await splitDeleteWhereInQuery(mediaItemIds, (chunk) =>
      trx('episode').whereIn('tvShowId', chunk).delete()
    );
    await splitDeleteWhereInQuery(mediaItemIds, (chunk) =>
      trx('season').whereIn('tvShowId', chunk).delete()
    );
    await splitDeleteWhereInQuery(mediaItemIds, (chunk) =>
      trx('mediaItem').whereIn('id', chunk).delete()
    );

    logger.debug(h`deleted ${mediaItemIds.length} unused media items`);
  });
};
