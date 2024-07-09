import { formatDistance } from 'date-fns';
import { existsSync } from 'fs';
import fs from 'fs/promises';
import { Knex } from 'knex';
import _ from 'lodash';
import path from 'path';

import { Database } from './database.js';
import { EpisodeModel, episodeModelSchema } from './entity/episodeModel.js';
import {
  MediaItemModel,
  mediaItemModelSchema,
} from './entity/mediaItemModel.js';
import { SeasonModel, seasonModelSchema } from './entity/seasonModel.js';
import { logger } from './logger.js';
import { metadataProviders } from './metadata/metadataProviders.js';
import { justWatchRepository } from './repository/justWatchRepository.js';
import { mediaItemRepository } from './repository/mediaItemRepository.js';
import { seenEpisodesCountRepository } from './repository/seenEpisodesCountRepository.js';
import { StaticConfiguration } from './staticConfiguration.js';
import { getImageId, h, withDefinedPropertyFactory } from './utils.js';
import { sendAndScheduledNotificationsForReleases } from './releaseNotifications.js';
import { scheduleLastAndUpcomingEpisodeAiringsUpdate } from './lastAndUpcomingEpisodeAirings.js';

export const updateMetadata = async (
  mediaItemToUpdate: MediaItemModel
): Promise<void> => {
  logger.debug(
    h`updating ${mediaItemToUpdate.mediaType} "${mediaItemToUpdate.title}", id: ${mediaItemToUpdate.id}` +
      (mediaItemToUpdate.lastTimeUpdated
        ? ` (previously updated ${formatDistance(
            new Date(mediaItemToUpdate.lastTimeUpdated),
            new Date(),
            {
              addSuffix: true,
            }
          )})`
        : '')
  );

  const metadataProvider = metadataProviders.getForMediaType(mediaItemToUpdate);

  if (!metadataProvider) {
    throw new Error(
      `no metadata provider for media type ${mediaItemToUpdate.mediaType} and source ${mediaItemToUpdate.source}`
    );
  }

  const updatedMetadata = await metadataProvider.details(mediaItemToUpdate);

  if (!updatedMetadata) {
    throw new Error(`no metadata for ${mediaItemToUpdate.title}`);
  }

  const imagesToDelete: string[] = [];

  const updateImage = (args: {
    oldImageId?: string | null;
    oldExternalUrl?: string | null;
    newExternalUrl?: string | null;
  }): string | null => {
    const { oldImageId, oldExternalUrl, newExternalUrl } = args;

    if (!newExternalUrl) {
      return null;
    }

    if (newExternalUrl && newExternalUrl !== oldExternalUrl) {
      if (oldImageId) {
        imagesToDelete.push(oldImageId);
      }

      return getImageId();
    }

    return oldImageId || null;
  };

  const updatedMediaItem: MediaItemModel = {
    ..._.merge({ ...mediaItemToUpdate }, updatedMetadata),
    id: mediaItemToUpdate.id,
    genres: updatedMetadata.genres?.join(',') || null,
    narrators: updatedMetadata.narrators?.join(',') || null,
    authors: updatedMetadata.authors?.join(',') || null,
    platform: updatedMetadata.platform
      ? JSON.stringify(updatedMetadata.platform)
      : null,
    theatricalReleaseDate:
      updatedMetadata.theatricalReleaseDate?.toISOString() || null,
    digitalReleaseDate:
      updatedMetadata.digitalReleaseDate?.toISOString() || null,
    physicalReleaseDate:
      updatedMetadata.physicalReleaseDate?.toISOString() || null,
    tvReleaseDate: updatedMetadata.tvReleaseDate?.toISOString() || null,
    lastTimeUpdated: Date.now(),
    posterId: updateImage({
      oldImageId: mediaItemToUpdate.posterId,
      oldExternalUrl: mediaItemToUpdate.externalPosterUrl,
      newExternalUrl: updatedMetadata.externalPosterUrl,
    }),
    backdropId: updateImage({
      oldImageId: mediaItemToUpdate.backdropId,
      oldExternalUrl: mediaItemToUpdate.externalBackdropUrl,
      newExternalUrl: updatedMetadata.externalBackdropUrl,
    }),
    upcomingEpisodeId: null,
    lastAiredEpisodeId: null,
  };

  if (mediaItemToUpdate.mediaType === 'tv') {
    await Database.knex.transaction(async (trx) => {
      await trx('mediaItem').where('id', mediaItemToUpdate.id).update({
        upcomingEpisodeId: null,
        lastAiredEpisodeId: null,
      });

      const existingSeasons = await trx('season').where(
        'tvShowId',
        mediaItemToUpdate.id
      );

      const existingEpisodes = await trx('episode').where(
        'tvShowId',
        mediaItemToUpdate.id
      );

      const seasonSearchFunctionFactory = searchFactory([
        'tmdbId',
        'tvdbId',
        'seasonNumber',
      ]);

      const episodeSearchFunctionFactory = searchFactory([
        'tmdbId',
        'imdbId',
        'tvdbId',
      ]);

      const searchNewSeasons = seasonSearchFunctionFactory(
        updatedMetadata.seasons
      );

      const searchExistingSeasons =
        seasonSearchFunctionFactory(existingSeasons);

      const seasonsToDelete = existingSeasons.filter(
        (item) => !searchNewSeasons(item)
      );

      for (const seasonToDelete of seasonsToDelete) {
        logger.debug(
          h`season ${seasonToDelete.seasonNumber} of tv show ${mediaItemToUpdate.title} (tmdb: ${mediaItemToUpdate.tmdbId}, imdb: ${mediaItemToUpdate.imdbId}) does not exists in ${metadataProvider.name} response, attempting to delete it`
        );

        const episodesToDelete = existingEpisodes.filter(
          (episode) => episode.seasonId === seasonToDelete.id
        );

        if (!(await deleteEpisodes(episodesToDelete, trx))) {
          continue;
        }

        await deleteSeason(seasonToDelete, trx);
      }

      for (const seasonToUpdate of existingSeasons) {
        const seasonMetadata = searchNewSeasons(seasonToUpdate);

        if (!seasonMetadata) {
          continue;
        }

        const searchNewEpisodes = episodeSearchFunctionFactory(
          seasonMetadata.episodes
        );
        const existingSeasonEpisodes = existingEpisodes.filter(
          (episode) => episode.seasonId === seasonToUpdate.id
        );

        const searchExistingEpisodes = episodeSearchFunctionFactory(
          existingSeasonEpisodes
        );

        const episodesToDelete = existingSeasonEpisodes.filter(
          (episode) => !searchNewEpisodes(episode)
        );

        if (!(await deleteEpisodes(episodesToDelete, trx))) {
          continue;
        }

        await trx('season')
          .update(
            seasonModelSchema.partial().parse({
              ...seasonMetadata,
              posterId: updateImage({
                oldImageId: seasonToUpdate.posterId,
                oldExternalUrl: seasonToUpdate.externalPosterUrl,
                newExternalUrl: seasonMetadata.externalPosterUrl,
              }),
            })
          )
          .where('id', seasonToUpdate.id);

        if (seasonMetadata.episodes) {
          const episodesWithDifferentNumbers = existingEpisodes
            .filter((episode) => episode.seasonId === seasonToUpdate.id)
            .map((episode) => ({
              old: episode,
              new: searchNewEpisodes(episode),
            }))
            .filter(withDefinedPropertyFactory('new'))
            .filter(
              (item) => item.old.episodeNumber !== item.new.episodeNumber
            );

          for (const episode of episodesWithDifferentNumbers) {
            logger.debug(
              h`changing episode number of episode ${formatEpisodeNumber(
                episode.old
              )} "${episode.old.title}" to ${formatEpisodeNumber(
                episode.new
              )} "${episode.new.title}"`
            );

            await trx('episode')
              .update('episodeNumber', -episode.old.episodeNumber)
              .where('id', episode.old.id);
          }

          for (const episode of episodesWithDifferentNumbers) {
            await trx('episode')
              .update('episodeNumber', episode.new.episodeNumber)
              .update(
                'seasonAndEpisodeNumber',
                episode.new.seasonNumber * 1000 + episode.new.episodeNumber
              )
              .where('id', episode.old.id);
          }

          await Promise.all(
            seasonMetadata.episodes.map(async (episode) => {
              const existingEpisode = searchExistingEpisodes(episode);

              if (existingEpisode) {
                await trx('episode')
                  .update(episodeModelSchema.partial().parse(episode))
                  .where('id', existingEpisode.id);
              } else {
                await trx('episode').insert(
                  episodeModelSchema.partial().parse({
                    ...episode,
                    tvShowId: mediaItemToUpdate.id,
                    seasonId: seasonToUpdate.id,
                    seasonAndEpisodeNumber:
                      seasonToUpdate.seasonNumber * 1000 +
                      episode.episodeNumber,
                  })
                );
              }
            })
          );
        }
      }

      // TODO: Test removing episodes
      // TODO: Test removing seasons
      // TODO: Test swapping episodes numbers

      const newSeasons =
        updatedMetadata.seasons?.filter(
          (item) => !searchExistingSeasons(item)
        ) || [];

      for (const newSeason of newSeasons) {
        logger.debug(
          h`adding season ${newSeason.seasonNumber} of "${mediaItemToUpdate.title}"`
        );

        const [insertedSeason] = await trx('season')
          .insert(
            seasonModelSchema.partial().parse({
              ...newSeason,
              numberOfEpisodes: newSeason?.episodes?.length || 0,
              posterId: newSeason.externalPosterUrl ? getImageId() : null,
              tvShowId: mediaItemToUpdate.id,
            })
          )
          .returning('*');

        if (newSeason.episodes) {
          await Promise.all(
            newSeason.episodes.map((episode) =>
              trx('episode').insert(
                episodeModelSchema.partial().parse({
                  ...episode,
                  tvShowId: mediaItemToUpdate.id,
                  seasonId: insertedSeason.id,
                  seasonAndEpisodeNumber:
                    insertedSeason.seasonNumber * 1000 + episode.episodeNumber,
                })
              )
            )
          );
        }
      }

      await trx('mediaItem')
        .update(mediaItemModelSchema.parse(updatedMediaItem))
        .where('id', mediaItemToUpdate.id);

      await mediaItemRepository.updateLastAndUpcomingEpisodeAirings({
        mediaItemIds: [mediaItemToUpdate.id],
        trx: trx,
      });

      await seenEpisodesCountRepository.recalculate({
        trx,
        mediaItemIds: [mediaItemToUpdate.id],
      });
    });
  } else {
    await Database.knex('mediaItem')
      .update(mediaItemModelSchema.parse(updatedMediaItem))
      .where('id', mediaItemToUpdate.id);
  }

  await deleteImages({
    imageIds: imagesToDelete,
    mediaItem: mediaItemToUpdate,
  });

  await justWatchRepository.update({
    mediaItemId: mediaItemToUpdate.id,
    justWatchAvailability: updatedMetadata.justWatch,
  });

  await sendAndScheduledNotificationsForReleases();
  await scheduleLastAndUpcomingEpisodeAiringsUpdate();
};

const deleteImages = async (args: {
  imageIds: string[];
  mediaItem: MediaItemModel;
}) => {
  const { imageIds, mediaItem } = args;

  if (imageIds.length === 0) {
    return;
  }

  logger.debug(
    h`deleting ${imageIds.length} images for mediaItem ${mediaItem.id}`
  );

  const imageSizesDirs = await fs.readdir(StaticConfiguration.assetsDir);

  await Promise.all(
    imageSizesDirs
      .flatMap((dir) =>
        imageIds.map((imageId) =>
          path.join(StaticConfiguration.assetsDir, dir, `${imageId}.webp`)
        )
      )
      .filter((image) => existsSync(image))
      .map((image) => fs.unlink(image))
  );
};

export const searchFactory = <
  U extends string,
  T extends Readonly<[U, ...U[]]>,
>(
  properties: T
) => {
  type ValueType = { [K in T[number]]?: any };

  return <P extends ValueType>(values?: P[] | null) => {
    const searchFunctions = properties.map((property) => {
      const map = _(values)
        .filter((item) => item[property] !== null)
        .filter((item) => item[property] !== undefined)
        .keyBy((item) => item[property]!)
        .value();

      return (itemToFind: ValueType) => {
        const value = itemToFind[property];
        if (value === undefined || value === null) {
          return null;
        }
        return map[value] || null;
      };
    });

    return (itemToFind: ValueType) => {
      for (const searchFunction of searchFunctions) {
        const res = searchFunction(itemToFind);
        if (res) {
          return res;
        }
      }
    };
  };
};

const formatEpisodeNumber = (episode: {
  seasonNumber: number;
  episodeNumber: number;
}) => {
  return `${episode.seasonNumber}x${episode.episodeNumber}`;
};

const canEpisodesBeDeleted = async (
  episodesToDelete: EpisodeModel[],
  trx: Knex.Transaction
) => {
  let res = true;
  const episodeIdMap = _.keyBy(episodesToDelete, 'id');
  const episodesIdToDelete = episodesToDelete.map((item) => item.id);
  const episodesString = episodesToDelete.map(formatEpisodeNumber).join(', ');

  logger.debug(
    h`attempting to remove episodes: ${episodesString} from a local database`
  );

  const seen = await trx('seen').whereIn('episodeId', episodesIdToDelete);

  if (seen.length > 0) {
    _(seen)
      .groupBy((item) => item.episodeId)
      .forEach((value, key) =>
        logger.debug(
          h`episode ${formatEpisodeNumber(
            episodeIdMap[key]
          )} cannot be deleted, it has been marked as seen by users: ${_(value)
            .groupBy((item) => item.userId)
            .mapValues((value) => value.length)
            .map(
              (seenCount, userId) =>
                `${userId} (seen ${seenCount} time${seenCount > 1 ? 's' : ''})`
            )
            .value()
            .join(', ')}`
        )
      );

    res = false;
  }

  const progress = await trx('progress').whereIn(
    'episodeId',
    episodesIdToDelete
  );

  if (progress.length > 0) {
    _(progress)
      .groupBy((item) => item.episodeId)
      .forEach((value, key) =>
        logger.debug(
          h`episode ${formatEpisodeNumber(
            episodeIdMap[key]
          )} cannot be deleted, it has progress entry for users: ${_(value)
            .map((item) => item.userId)
            .uniq()
            .value()
            .join(', ')}`
        )
      );

    res = false;
  }

  const listItems = await trx('listItem').whereIn(
    'episodeId',
    episodesIdToDelete
  );

  if (listItems.length > 0) {
    _(listItems)
      .groupBy((item) => item.episodeId)
      .forEach((value, key) =>
        logger.debug(
          h`episode ${formatEpisodeNumber(
            episodeIdMap[key]
          )} cannot be deleted, it is on the following lists: ${_(value)
            .map((item) => item.listId)
            .uniq()
            .value()
            .join(', ')}`
        )
      );

    res = false;
  }

  const userRating = await trx('userRating').whereIn(
    'episodeId',
    episodesIdToDelete
  );

  if (userRating.length > 0) {
    _(progress)
      .groupBy((item) => item.episodeId)
      .forEach((value, key) =>
        logger.debug(
          h`episode ${formatEpisodeNumber(
            episodeIdMap[key]
          )} cannot be deleted, it has been rated by users: ${_(value)
            .map((item) => item.userId)
            .uniq()
            .value()
            .join(', ')}`
        )
      );

    res = false;
  }

  return res;
};

const deleteEpisodes = async (
  episodesToDelete: EpisodeModel[],
  trx: Knex.Transaction
) => {
  if (episodesToDelete.length === 0) {
    return true;
  }

  if (!(await canEpisodesBeDeleted(episodesToDelete, trx))) {
    return false;
  }

  const episodesIdToDelete = episodesToDelete.map((item) => item.id);

  await trx('notificationsHistory')
    .whereIn('episodeId', episodesIdToDelete)
    .delete();
  await trx('episode').whereIn('id', episodesIdToDelete).delete();

  const episodesString = episodesToDelete.map(formatEpisodeNumber).join(', ');

  logger.debug(h`removed episodes: ${episodesString} from a local database`);

  return true;
};

const canSeasonBeDeleted = async (
  season: SeasonModel,
  trx: Knex.Transaction
) => {
  let res = true;

  logger.debug(
    h`attempting to remove season ${season.seasonNumber} from a local database`
  );

  const listItems = await trx('listItem').where('seasonId', season.id);

  if (listItems.length > 0) {
    logger.debug(
      h`season ${
        season.seasonNumber
      } cannot be deleted, it is on the following lists: ${_(listItems)
        .map((item) => item.listId)
        .uniq()
        .value()
        .join(', ')}`
    );

    res = false;
  }

  const userRating = await trx('userRating').where('seasonId', season.id);

  if (userRating.length > 0) {
    logger.debug(
      h`season ${
        season.seasonNumber
      } cannot be deleted, it has been rated by users: ${_(userRating)
        .map((item) => item.userId)
        .uniq()
        .value()
        .join(', ')}`
    );

    res = false;
  }

  return res;
};

const deleteSeason = async (season: SeasonModel, trx: Knex.Transaction) => {
  if (!(await canSeasonBeDeleted(season, trx))) {
    return false;
  }

  await trx('season').where('id', season.id).delete();
  logger.debug(h`deleted season ${season.seasonNumber} from local database`);

  return true;
};
