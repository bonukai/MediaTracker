import _ from 'lodash';
import { ExternalIds, MediaType } from 'src/entity/mediaItem';
import { logger } from 'src/logger';
import { Audible } from 'src/metadata/provider/audible';
import { OpenLibrary } from 'src/metadata/provider/openlibrary';
import { TMDbMovie, TMDbTv } from 'src/metadata/provider/tmdb';
import { mediaItemRepository } from 'src/repository/mediaItem';

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
  const res = await search(args);

  if (res) {
    const existingItem = await mediaItemRepository.findByExternalId(
      res,
      args.mediaType
    );

    if (!existingItem) {
      return await mediaItemRepository.create(res);
    }
  }
};

const search = async (args: { id: ExternalIds; mediaType: MediaType }) => {
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
      } catch (error) {
      } finally {
        logger.error(`unable to find tv show with tmdbId: ${id.tmdbId}`);
      }
    }
    if (id.imdbId) {
      logger.debug(`searching tv show by imdbId: ${id.imdbId}`);
      try {
        const res = await new TMDbTv().findByImdbId(id.imdbId);
        if (res) {
          return res;
        }
        // eslint-disable-next-line no-empty
      } catch (error) {
      } finally {
        logger.error(`unable to find tv show with imdbId: ${id.imdbId}`);
      }
    }
    if (id.tvdbId) {
      logger.debug(`searching tv show by tvdbId: ${id.tvdbId}`);
      try {
        const res = await new TMDbTv().findByTvdbId(id.tvdbId);
        if (res) {
          return res;
        }
        // eslint-disable-next-line no-empty
      } catch (error) {
      } finally {
        logger.error(`unable to find tv show with tvdbId: ${id.tvdbId}`);
      }
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
      } catch (error) {
      } finally {
        logger.error(`unable to find movie with tmdbId: ${id.tmdbId}`);
      }
    }
    if (id.imdbId) {
      logger.debug(`searching movie by imdbId: ${id.imdbId}`);
      try {
        const res = await new TMDbMovie().findByImdbId(id.imdbId);
        if (res) {
          return res;
        }
        // eslint-disable-next-line no-empty
      } catch (error) {
      } finally {
        logger.error(`unable to find movie with imdbId: ${id.imdbId}`);
      }
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
      } catch (error) {
      } finally {
        logger.error(
          `unable to find audiobook with audibleId: ${id.audibleId}`
        );
      }
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
      } catch (error) {
      } finally {
        logger.error(
          `unable to find book with openlibraryId: ${id.openlibraryId}`
        );
      }
    }
  }

  logger.error(
    `no metadata provider for type ${mediaType} with external ids ${JSON.stringify(
      _.omitBy(id, (value) => !value)
    )}`
  );
};
