import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { z } from 'zod';

import { TRPCError } from '@trpc/server';

import { Database } from '../database.js';
import { logger } from '../logger.js';
import { protectedProcedure, router } from '../router.js';
import { StaticConfiguration } from '../staticConfiguration.js';

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

      const sendImage = async (imagePath: string) => {
        if (!existsSync(imagePath)) {
          throw new TRPCError({
            code: 'NOT_FOUND',
          });
        }

        ctx.setHeader('Cache-Control', 'max-age=31536000');
        ctx.setHeader('Content-Type', 'image/webp');
        await ctx.sendFile(imagePath);
      };

      const imageOriginalPath = path.resolve(
        StaticConfiguration.assetsDir,
        'original',
        `${id}.webp`
      );

      if (!existsSync(imageOriginalPath)) {
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
            throw new TRPCError({
              code: 'NOT_FOUND',
            });
          } else {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: downloadedImageReq.statusText,
            });
          }
        }

        const downloadedImage = await downloadedImageReq.arrayBuffer();

        await fs.mkdir(path.dirname(imageOriginalPath), { recursive: true });

        await sharp(downloadedImage)
          .resize({ width: MAX_POSTER_WIDTH })
          .webp({ quality: 80 })
          .toFile(imageOriginalPath);

        if (typeof width === 'number' && width < MAX_POSTER_WIDTH) {
          const imageSizePath = path.resolve(
            StaticConfiguration.assetsDir,
            width.toString(),
            `${id}.webp`
          );

          await fs.mkdir(path.dirname(imageSizePath), { recursive: true });
          await sharp(downloadedImage)
            .resize({ width })
            .webp({ quality: 80 })
            .toFile(imageSizePath);

          await sendImage(imageSizePath);
          return;
        }
      }

      if (typeof width === 'number' && width < MAX_POSTER_WIDTH) {
        const imageSizePath = path.resolve(
          StaticConfiguration.assetsDir,
          width.toString(),
          `${id}.webp`
        );

        const originalImage = await fs.readFile(imageOriginalPath);

        await fs.mkdir(path.dirname(imageSizePath), { recursive: true });
        await sharp(originalImage)
          .resize({ width })
          .webp({ quality: 80 })
          .toFile(imageSizePath);

        await sendImage(imageSizePath);
      } else {
        await sendImage(imageOriginalPath);
      }
    }),
});

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
