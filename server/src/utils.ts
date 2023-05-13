import axios from 'axios';
import { add } from 'date-fns';
import { ensureDir, pathExists, rm } from 'fs-extra';
import path from 'path';
import sharp from 'sharp';

import { Config } from 'src/config';
import { AudibleCountryCode } from 'src/entity/configuration';
import { getImageId, ImageType } from 'src/entity/image';
import { MediaItemBase } from 'src/entity/mediaItem';
import { logger } from 'src/logger';
import { Audible } from 'src/metadata/provider/audible';
import { GlobalConfiguration } from 'src/repository/globalSettings';
import { imageRepository } from 'src/repository/image';

export const durationToMilliseconds = (duration: Duration) =>
  add(0, duration).getTime();

export const downloadAsset = async (args: { imageId: string; url: string }) => {
  const { imageId, url } = args;

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
  url: string;
  mediaItemId: number;
  seasonId?: number;
}) => {
  const { mediaItemId, url, seasonId, type } = args;

  const oldPoster = await imageRepository.findOne({
    mediaItemId: mediaItemId,
    seasonId: seasonId || null,
    type: type,
  });

  const newImageId = getImageId();

  await downloadAsset({
    imageId: newImageId,
    url: url,
  });

  if (oldPoster) {
    await imageRepository.updateWhere({
      value: {
        id: newImageId,
      },
      where: {
        id: oldPoster.id,
      },
    });

    const imagePath = `/img/original/${oldPoster.id}`;
    if (await pathExists(imagePath)) {
      await rm(imagePath);
    }

    const smallImagePath = `/img/original/${oldPoster.id}`;
    if (await pathExists(smallImagePath)) {
      await rm(smallImagePath);
    }
  } else {
    await imageRepository.create({
      id: newImageId,
      mediaItemId: mediaItemId,
      seasonId: seasonId || null,
      type: type,
    });
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
};
