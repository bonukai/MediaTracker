import _ from 'lodash';

import {
  externalIdColumnNames,
  ExternalIds,
  MediaItemMetadata,
  MediaItemModel,
  MediaType,
} from '../entity/mediaItemModel.js';
import { logger } from '../logger.js';
import { h } from '../utils.js';
import { MetadataProvider } from './metadataProvider.js';
import { Audible } from './provider/audible.js';
import { IGDB } from './provider/igdb.js';
import { OpenLibrary } from './provider/openlibrary.js';
import { TmdbMovie } from './provider/tmdbMovie.js';
import { TmdbTv } from './provider/tmdbTv.js';

const providers = <const>[TmdbMovie, TmdbTv, Audible, OpenLibrary, IGDB];

const providersByType = _.keyBy(providers, (provider) => provider.mediaType);

export const metadataProviders = {
  get(mediaType: MediaType): MetadataProvider | undefined {
    return providersByType[mediaType];
  },
  getForMediaType(mediaItem: MediaItemModel): MetadataProvider | undefined {
    switch (mediaItem.mediaType) {
      case 'tv':
        if (typeof mediaItem.tmdbId === 'number') {
          return TmdbTv;
        }
        break;
      case 'movie':
        if (typeof mediaItem.tmdbId === 'number') {
          return TmdbMovie;
        }
        break;
      case 'book':
        if (typeof mediaItem.openlibraryId === 'string') {
          return OpenLibrary;
        }
        break;
      case 'video_game':
        if (typeof mediaItem.igdbId === 'number') {
          return IGDB;
        }
        break;
      case 'audiobook':
        if (typeof mediaItem.audibleId === 'string') {
          return Audible;
        }
        break;
    }
  },
  getSourceNames() {
    return providers.map((item) => item.name);
  },
  async searchByExternalId(args: {
    mediaType: MediaType;
    ids: ExternalIds;
  }): Promise<MediaItemMetadata | undefined> {
    const { mediaType, ids } = args;

    const metadataProvider = this.get(mediaType);

    if (!metadataProvider) {
      logger.error(`no provider for metadata of type "${mediaType}"`);
      return;
    }

    for (const externalIdColumnName of externalIdColumnNames) {
      const externalId = ids[externalIdColumnName];

      if (externalId === undefined || externalId === null) {
        continue;
      }

      const searchFunction = getSearchFunctionFromMetadataProvider(
        metadataProvider,
        externalIdColumnName
      );

      if (!searchFunction) {
        continue;
      }

      logger.debug(
        h`searching media type ${mediaType} in ${metadataProvider.name} by ${externalIdColumnName} for ${externalId}`
      );

      try {
        const res = await searchFunction(externalId as never);

        if (res) {
          logger.debug(
            h`found item ${res.title} with ${externalIdColumnName}: ${externalId}`
          );
          return res;
        }
      } catch (error) {}

      logger.debug(h`unable to find ${externalId} in ${metadataProvider.name}`);
    }
  },
  async searchByTitleAndReleaseYear(args: {
    mediaType: MediaType;
    title: string;
    releaseYear: number;
  }): Promise<MediaItemMetadata | undefined> {
    const { mediaType, title, releaseYear } = args;

    const provider = this.get(mediaType);

    if (!provider) {
      return;
    }

    const searchRes = await provider.search({
      query: title,
      releaseYear: releaseYear,
    });

    const firstMatch = searchRes.at(0);

    if (firstMatch && firstMatch.title === title) {
      return firstMatch;
    }
  },
} as const;

const getSearchFunctionFromMetadataProvider = (
  metadataProvider: MetadataProvider,
  externalId: (typeof externalIdColumnNames)[number]
) => {
  return (() => {
    if (externalId === 'audibleId') {
      return metadataProvider.findByAudibleId;
    } else if (externalId === 'tmdbId') {
      return metadataProvider.findByTmdbId;
    } else if (externalId === 'imdbId') {
      return metadataProvider.findByImdbId;
    } else if (externalId === 'tvdbId') {
      return metadataProvider.findByTvdbId;
    } else if (externalId === 'igdbId') {
      return metadataProvider.findByIgdbId;
    } else if (externalId === 'openlibraryId') {
      return metadataProvider.findByOpenLibraryId;
    }

    return null;
  })()?.bind(metadataProvider);
};
