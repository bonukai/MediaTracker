import axios from 'axios';
import { add } from 'date-fns';
import { ensureDir, pathExists, rm } from 'fs-extra';
import { customAlphabet } from 'nanoid';
import path from 'path';
import sharp from 'sharp';

import { Config } from 'src/config';
import { Database } from 'src/dbconfig';
import { AudibleCountryCode } from 'src/entity/configuration';
import { MediaItemBase } from 'src/entity/mediaItem';
import { TvSeason } from 'src/entity/tvseason';
import { logger } from 'src/logger';
import { Audible } from 'src/metadata/provider/audible';
import { GlobalConfiguration } from 'src/repository/globalSettings';

export type ImageType = 'poster' | 'backdrop';

export const durationToMilliseconds = (duration: Duration) =>
  add(0, duration).getTime();

export const downloadAsset = async (args: { imageId: string; url: string }) => {
  const { imageId, url } = args;

  logger.debug(`downloading image ${imageId} from ${url}`);

  const imagePath = path.resolve(
    Config.ASSETS_PATH,
    'original',
    `${imageId}.webp`
  );

  const imageSmallPath = path.resolve(
    Config.ASSETS_PATH,
    'small',
    `${imageId}.webp`
  );

  const response = await axios.get<Uint8Array>(url, {
    responseType: 'arraybuffer',
  });

  await ensureDir(path.dirname(imagePath));
  await sharp(response.data)
    .resize({ width: 800 })
    .webp({ quality: 80 })
    .toFile(imagePath);

  await ensureDir(path.dirname(imageSmallPath));
  await sharp(response.data)
    .resize({ width: 400 })
    .webp({ quality: 80 })
    .toFile(imageSmallPath);
};

export const updateAsset = async (args: {
  type: ImageType;
  mediaItem?: MediaItemBase;
  season?: TvSeason;
}) => {
  const { mediaItem, season, type } = args;

  const oldPosterId = season
    ? type === 'poster' && season.posterId
    : type === 'poster' && mediaItem && !season
    ? mediaItem.posterId
    : type === 'backdrop' && mediaItem && !season
    ? mediaItem.backdropId
    : undefined;

  const newImageId = getImageId();

  if (type === 'poster' && season) {
    await Database.knex('season')
      .update('posterId', newImageId)
      .where('id', season.id);
  } else if (type === 'poster' && mediaItem && !season) {
    await Database.knex('mediaItem')
      .update('posterId', newImageId)
      .where('id', mediaItem.id);
  } else if (type === 'backdrop' && mediaItem && !season) {
    await Database.knex('mediaItem')
      .update('backdropId', newImageId)
      .where('id', mediaItem.id);
  }

  if (oldPosterId) {
    const imagePath = `/img/original/${oldPosterId}`;
    if (await pathExists(imagePath)) {
      await rm(imagePath);
    }

    const smallImagePath = `/img/small/${oldPosterId}`;
    if (await pathExists(smallImagePath)) {
      await rm(smallImagePath);
    }
  }
};

export const catchAndLogError = async (fn: () => Promise<void> | void) => {
  try {
    await fn();
  } catch (error) {
    logger.error(error);
  }
};

export const inArray = <T extends string>(value: T, values: T[]) => {
  return values.includes(value);
};

export const generateExternalUrl = (mediaItem: MediaItemBase) => {
  if (mediaItem.mediaType === 'tv' || mediaItem.mediaType === 'movie') {
    if (mediaItem.imdbId) {
      return `https://www.imdb.com/title/${mediaItem.imdbId}`;
    }

    if (mediaItem.tmdbId) {
      return `https://www.themoviedb.org/${mediaItem.mediaType}/${mediaItem.tmdbId}`;
    }
  }

  if (mediaItem.mediaType === 'video_game') {
    if (mediaItem.igdbId) {
      return `https://www.igdb.com/games/${mediaItem.title
        .toLowerCase()
        .replaceAll(' ', '-')}`;
    }
  }

  if (mediaItem.mediaType === 'book') {
    if (mediaItem.openlibraryId) {
      return `https://openlibrary.org${mediaItem.openlibraryId}`;
    }
  }

  if (mediaItem.mediaType === 'audiobook') {
    if (mediaItem.audibleId) {
      const audibleDomain = new Audible().domain(
        mediaItem.audibleCountryCode ||
          (GlobalConfiguration.configuration.audibleLang?.toLocaleLowerCase() as AudibleCountryCode)
      );

      return `https://audible.${audibleDomain}/pd/${mediaItem.audibleId}?overrideBaseCountry=true&ipRedirectOverride=true`;
    }
  }

  if (mediaItem.mediaType === 'music') {
    if (mediaItem.musicBrainzId) {
      return `https://musicbrainz.org/release-group/${mediaItem.musicBrainzId}`;
    }
  }
};

export const getImageId = customAlphabet('1234567890abcdef', 32);
