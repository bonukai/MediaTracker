import _ from 'lodash';
import { ExternalIds, MediaType } from 'src/entity/mediaItem';
import { logger } from 'src/logger';
import { Audible } from 'src/metadata/provider/audible';
import { OpenLibrary } from 'src/metadata/provider/openlibrary';
import { TMDbMovie, TMDbTv } from 'src/metadata/provider/tmdb';
import { tvEpisodeRepository } from 'src/repository/episode';
import { mediaItemRepository } from 'src/repository/mediaItem';
import { updateMediaItem } from 'src/updateMetadata';

export const findEpisodeByExternalId = async (args: {
  imdbId?: string;
  tmdbId?: number;
  tvdbId?: number;
}) => {
  const { imdbId, tmdbId, tvdbId } = args;

  const episode = await tvEpisodeRepository.findOne({
    tmdbId: tmdbId || undefined,
    tvdbId: tvdbId || undefined,
    imdbId: imdbId || undefined,
  });

  if (episode) {
    const mediaItem = await mediaItemRepository.findOne({ id: episode.tvdbId });

    return {
      mediaItem: mediaItem,
      episode: episode,
    };
  }

  if (imdbId) {
    const res = await new TMDbTv().findByEpisodeImdbId(imdbId);

    if (res) {
      return await findMediaItemOrEpisodeByExternalId({
        mediaType: 'tv',
        id: {
          tmdbId: res.tvShowTmdbId,
        },
        episodeNumber: res.episode.episodeNumber,
        seasonNumber: res.episode.seasonNumber,
      });
    }
  } else if (tvdbId) {
    const res = await new TMDbTv().findByEpisodeTvdbId(tvdbId);

    if (res) {
      return await findMediaItemOrEpisodeByExternalId({
        mediaType: 'tv',
        id: {
          tmdbId: res.tvShowTmdbId,
        },
        episodeNumber: res.episode.episodeNumber,
        seasonNumber: res.episode.seasonNumber,
      });
    }
  }

  throw `Unable to find episode with imdbId: ${imdbId}, tmdbId: ${tmdbId}, tvdbId: ${tvdbId}`;
};

export const findMediaItemOrEpisodeByExternalId = async (args: {
  mediaType: MediaType;
  id: {
    imdbId?: string;
    tmdbId?: number;
    audibleId?: string;
    igdbId?: number;
  };
  seasonNumber?: number;
  episodeNumber?: number;
}) => {
  const { mediaType, id, seasonNumber, episodeNumber } = args;

  if (
    mediaType === 'tv' &&
    (typeof seasonNumber !== 'number' || typeof episodeNumber !== 'number')
  ) {
    return {
      error: 'Season end episode number are required for mediaType "tv"',
    };
  }

  if (!id.imdbId && !id.tmdbId && !id.audibleId && !id.igdbId) {
    return {
      error: 'At least one external id is required',
    };
  }

  const mediaItem = await findMediaItemByExternalId({
    id: id,
    mediaType: mediaType,
  });

  if (!mediaItem) {
    return {
      error: `Unable to find mediaItem with id: ${JSON.stringify(id)}`,
    };
  }

  if (mediaType === 'tv') {
    if (mediaItem.needsDetails) {
      await updateMediaItem(mediaItem);
    }

    const episode = await tvEpisodeRepository.findOne({
      tvShowId: mediaItem.id,
      episodeNumber: episodeNumber,
      seasonNumber: seasonNumber,
    });

    if (!episode) {
      return {
        error: `Unable to find episode S${seasonNumber}E${episodeNumber} for ${mediaItem.title}`,
      };
    }

    return {
      mediaItem: mediaItem,
      episode: episode,
    };
  }

  return {
    mediaItem: mediaItem,
  };
};

export const findMediaItemByExternalId = async (args: {
  id: ExternalIds;
  mediaType: MediaType;
}) => {
  const { id, mediaType } = args;
  const existingItem = await mediaItemRepository.findByExternalId(
    id,
    mediaType
  );

  if (!existingItem) {
    return await findMediaItemByExternalIdInExternalSources(args);
  }

  return existingItem;
};

export const findMediaItemByExternalIdInExternalSources = async (args: {
  id: ExternalIds;
  mediaType: MediaType;
}) => {
  const res = await searchMediaItem(args);

  if (res) {
    const existingItem = await mediaItemRepository.findByExternalId(
      res,
      args.mediaType
    );

    if (!existingItem) {
      return await mediaItemRepository.create(res);
    }

    return existingItem;
  }
};

const searchMediaItem = async (args: {
  id: ExternalIds;
  mediaType: MediaType;
}) => {
  const { id, mediaType } = args;

  if (mediaType === 'tv') {
    if (id.tmdbId) {
      logger.debug(`searching tv show by tmdbId: ${id.tmdbId}`);
      try {
        const res = await new TMDbTv().findByTmdbId(id.tmdbId);
        if (res) {
          return res;
        }
        // eslint-disable-next-line no-empty
      } catch (error) {}
      logger.error(`unable to find tv show with tmdbId: ${id.tmdbId}`);
    }
    if (id.imdbId) {
      logger.debug(`searching tv show by imdbId: ${id.imdbId}`);
      try {
        const res = await new TMDbTv().findByImdbId(id.imdbId);
        if (res) {
          return res;
        }
        // eslint-disable-next-line no-empty
      } catch (error) {}
      logger.error(`unable to find tv show with imdbId: ${id.imdbId}`);
    }
    if (id.tvdbId) {
      logger.debug(`searching tv show by tvdbId: ${id.tvdbId}`);
      try {
        const res = await new TMDbTv().findByTvdbId(id.tvdbId);
        if (res) {
          return res;
        }
        // eslint-disable-next-line no-empty
      } catch (error) {}
      logger.error(`unable to find tv show with tvdbId: ${id.tvdbId}`);
    }
    return;
  } else if (mediaType === 'movie') {
    if (id.tmdbId) {
      logger.debug(`searching movie by tmdbId: ${id.tmdbId}`);
      try {
        const res = await new TMDbMovie().findByTmdbId(id.tmdbId);
        if (res) {
          return res;
        }
        // eslint-disable-next-line no-empty
      } catch (error) {}
      logger.error(`unable to find movie with tmdbId: ${id.tmdbId}`);
    }
    if (id.imdbId) {
      logger.debug(`searching movie by imdbId: ${id.imdbId}`);
      try {
        const res = await new TMDbMovie().findByImdbId(id.imdbId);
        if (res) {
          return res;
        }
        // eslint-disable-next-line no-empty
      } catch (error) {}
      logger.error(`unable to find movie with imdbId: ${id.imdbId}`);
    }
    return;
  } else if (mediaType === 'audiobook') {
    if (id.audibleId) {
      try {
        const res = await new Audible().findByAudibleId(id.audibleId);
        if (res) {
          return res;
        }
        // eslint-disable-next-line no-empty
      } catch (error) {}
      logger.error(`unable to find audiobook with audibleId: ${id.audibleId}`);
    }
  } else if (mediaType === 'book') {
    if (id.openlibraryId) {
      try {
        const res = await new OpenLibrary().details({
          openlibraryId: id.openlibraryId,
        });
        if (res) {
          return res;
        }
        // eslint-disable-next-line no-empty
      } catch (error) {}
      logger.error(
        `unable to find book with openlibraryId: ${id.openlibraryId}`
      );
    }
  }

  logger.error(
    `no metadata provider for type ${mediaType} with external ids ${JSON.stringify(
      _.omitBy(id, (value) => !value)
    )}`
  );
};
