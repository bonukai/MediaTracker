import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { z } from 'zod';

import { TRPCError } from '@trpc/server';

import { Database } from '../database.js';
import { logger } from '../logger.js';
import { protectedProcedure, router } from '../router.js';
import { StaticConfiguration } from '../staticConfiguration.js';
import { is } from '../utils.js';

const MAX_POSTER_WIDTH = 800;

export const imgRouter = router({
  get: protectedProcedure
    .meta({ openapi: { method: 'GET', contentType: 'image/webp' } })
    .input(
      z.object({
        id: z
          .string()
          .regex(
            /^[a-z|A-Z|0-9].+$/,
            'image id can contain only letters and numbers'
          ),
        width: z.coerce.number().int().min(1).nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { width, id } = input;

      const imagePath = imageManager.getImage(id, width);

      if (!imagePath) {
        throw new TRPCError({
          code: 'NOT_FOUND',
        });
      }

      ctx.setHeader('Cache-Control', 'max-age=31536000');
      ctx.setHeader('Content-Type', 'image/webp');
      await ctx.sendFile(imagePath);
    }),
});

class ImageManager {
  private inProgress = new Set<string>();

  getImage(id: string, width?: number | null) {
    if (this.isRunningJob(id, width)) {
      return;
    }

    const imagePath = this.getImagePath(id, width);

    if (existsSync(imagePath)) {
      return imagePath;
    }

    if (!this.isRunningJob(id, width)) {
      this.startJob(id, width);
    }
  }

  private async startJob(id: string, width?: number | null) {
    const key = [id, width].toString();

    this.inProgress.add(key);

    try {
      const imageOriginalPath = this.getImagePath(id);

      if (existsSync(imageOriginalPath)) {
        if (!is(width)) {
          return;
        }

        await this.resizeAlreadyDownloadImage(id, width);
        return;
      }

      const image = await this.downloadImage(id);

      if (image) {
        await this.saveAndResizeImage({
          image,
          id,
          width,
        });
      }
    } catch (e) {
      logger.error(e);
    } finally {
      this.inProgress.delete(key);
    }
  }

  private async downloadImage(id: string) {
    const imageUrl = await findImageUrlFromInternalId(id);

    if (!imageUrl) {
      throw new TRPCError({
        code: 'NOT_FOUND',
      });
    }

    logger.debug(`downloading image ${id} from ${imageUrl}`);

    const downloadedImageReq = await fetch(imageUrl);

    if (!downloadedImageReq.ok) {
      if (downloadedImageReq.status === 400) {
        logger.error(`image ${imageUrl} not found`);
        // TODO: remove url from DB
      } else {
        logger.error(
          `failed to download ${imageUrl} :${downloadedImageReq.statusText}`
        );
      }

      return;
    }

    return await downloadedImageReq.arrayBuffer();
  }

  private async saveAndResizeImage(args: {
    image: ArrayBuffer;
    id: string;
    width?: number | null;
  }) {
    const { image, id, width } = args;
    const imageOriginalPath = this.getImagePath(id);

    await fs.mkdir(path.dirname(imageOriginalPath), { recursive: true });

    await sharp(image)
      .resize({ width: MAX_POSTER_WIDTH })
      .webp({ quality: 80 })
      .toFile(imageOriginalPath);

    if (is(width) && width < MAX_POSTER_WIDTH) {
      const imageSizePath = this.getImagePath(id, width);
      await fs.mkdir(path.dirname(imageSizePath), { recursive: true });
      await sharp(image)
        .resize({ width })
        .webp({ quality: 80 })
        .toFile(imageSizePath);

      return imageSizePath;
    }
  }

  private isRunningJob(id: string, width?: number | null) {
    const key = [id, width].toString();

    return this.inProgress.has(key);
  }

  private getImagePath(id: string, width?: number | null) {
    return path.resolve(
      StaticConfiguration.assetsDir,
      is(width) ? width.toString() : 'original',
      `${id}.webp`
    );
  }

  private async resizeAlreadyDownloadImage(id: string, width: number) {
    const imageSizePath = this.getImagePath(id, width);

    const originalImage = await fs.readFile(this.getImagePath(id));

    await fs.mkdir(path.dirname(imageSizePath), { recursive: true });

    await sharp(originalImage)
      .resize({ width })
      .webp({ quality: 80 })
      .toFile(imageSizePath);

    return imageSizePath;
  }
}

export const imageManager = new ImageManager();

export const findImageUrlFromInternalId = async (imageId: string) => {
  const mediaItemWithPoster = await Database.knex('mediaItem')
    .where('posterId', imageId)
    .first();

  if (mediaItemWithPoster) {
    return mediaItemWithPoster.externalPosterUrl;
  }

  const mediaItemWithBackdrop = await Database.knex('mediaItem')
    .where('backdropId', imageId)
    .first();

  if (mediaItemWithBackdrop) {
    return mediaItemWithBackdrop.externalBackdropUrl;
  }

  const seasonWithPoster = await Database.knex('season')
    .where('posterId', imageId)
    .first();

  if (seasonWithPoster) {
    return seasonWithPoster.externalPosterUrl;
  }

  const justWatchProviderLogo = await Database.knex('justWatchProvider')
    .where('logo', imageId)
    .first();

  if (justWatchProviderLogo) {
    return justWatchProviderLogo.externalLogoUrl;
  }
};
