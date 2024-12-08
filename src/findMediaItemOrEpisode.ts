import { EpisodeModel } from './entity/episodeModel.js';
import { MediaItemModel, MediaType } from './entity/mediaItemModel.js';
import { logger } from './logger.js';
import { metadataProviders } from './metadata/metadataProviders.js';
import { mediaItemRepository } from './repository/mediaItemRepository.js';
import { updateMetadata } from './updateMetadata.js';

export const findMediaItemOrEpisode = async (args: {
  userId: number;
  mediaType: MediaType;
  id: {
    imdbId?: string | null;
    tmdbId?: number | null;
    tvdbId?: number | null;
    igdbId?: number | null;
    audibleId?: string | null;
  };
  title?: string | null;
  releaseYear?: number | null;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
}): Promise<
  | {
      mediaItem: MediaItemModel;
      episode?: EpisodeModel;
    }
  | undefined
> => {
  const mediaItem = await findMediaItem(args);

  if (!mediaItem) {
    return;
  }

  if (args.mediaType === 'tv') {
    if (
      typeof args.seasonNumber !== 'number' ||
      typeof args.episodeNumber !== 'number'
    ) {
      throw new Error(
        `seasonNumber and episodeNumber are required, when mediaType is tv. Provided: ${args.seasonNumber} and ${args.episodeNumber}`
      );
    }

    const episode = await mediaItemRepository.findEpisode({
      mediaItemId: mediaItem.id,
      seasonNumber: args.seasonNumber,
      episodeNumber: args.episodeNumber,
    });

    if (episode) {
      return {
        mediaItem,
        episode,
      };
    } else {
      await updateMetadata(mediaItem);

      const episode = await mediaItemRepository.findEpisode({
        mediaItemId: mediaItem.id,
        seasonNumber: args.seasonNumber,
        episodeNumber: args.episodeNumber,
      });

      if (episode) {
        return {
          mediaItem,
          episode,
        };
      } else {
        throw new Error(
          `unable to find episode of ${mediaItem.title} (id: ${mediaItem.id}) ${args.seasonNumber}x${args.episodeNumber}`
        );
      }
    }
  } else {
    return {
      mediaItem,
    };
  }
};

const findMediaItem = async (args: {
  mediaType: MediaType;
  id: {
    imdbId?: string | null;
    tmdbId?: number | null;
    tvdbId?: number | null;
  };
  title?: string | null;
  releaseYear?: number | null;
}): Promise<MediaItemModel | undefined> => {
  const internalDatabaseRes = await mediaItemRepository.findByExternalId({
    mediaType: args.mediaType,
    ids: args.id,
  });

  if (internalDatabaseRes) {
    return internalDatabaseRes;
  }

  const externalRes = await metadataProviders.searchByExternalId({
    mediaType: args.mediaType,
    ids: args.id,
  });

  if (externalRes) {
    return await mediaItemRepository.findOrCreate(externalRes);
  }

  if (typeof args.title === 'string' && typeof args.releaseYear === 'number') {
    const res = await mediaItemRepository.findByTitleAndReleaseYear({
      mediaType: args.mediaType,
      title: args.title,
      releaseYear: args.releaseYear,
    });

    if (res) {
      return res;
    }

    const externalRes = await metadataProviders.searchByTitleAndReleaseYear({
      mediaType: args.mediaType,
      title: args.title,
      releaseYear: args.releaseYear,
    });

    if (externalRes) {
      return await mediaItemRepository.findOrCreate(externalRes);
    }
  }

  logger.error(
    `unable to identify mediaItem with following arguments: ${JSON.stringify(
      args
    )}`
  );
};
