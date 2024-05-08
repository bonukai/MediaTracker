import { z } from 'zod';

import { mediaTypeSchema } from '../entity/mediaItemModel.js';
import { findMediaItemOrEpisode } from '../findMediaItemOrEpisode.js';
import { progressRepository } from '../repository/progressRepository.js';
import { protectedProcedure, router } from '../router.js';
import { logger } from '../logger.js';
import { h } from '../utils.js';

export const progressRouter = router({
  set: protectedProcedure
    .input(
      z.object({
        mediaItemId: z.number(),
        episodeId: z.number().nullable(),
        progress: z.number().min(0).max(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;

      logger.debug(
        h`settings progress of (id: ${input.mediaItemId})${
          input.episodeId ? ` (episodeId: ${input.episodeId})` : ''
        } at ${(input.progress * 100).toFixed(2)}% for user ${userId}`
      );

      await progressRepository.set({
        userId,
        ...input,
      });
    }),
  setByExternalId: protectedProcedure
    .input(
      z.object({
        mediaType: mediaTypeSchema,
        id: z.object({
          imdbId: z.string().nullish(),
          tmdbId: z.number().nullish(),
          tvdbId: z.coerce.number().nullish(),
        }),
        seasonNumber: z.number().nullish(),
        episodeNumber: z.number().nullish(),
        title: z.string().nullish(),
        releaseYear: z.number().nullish(),
        device: z.string().nullish(),
        progress: z.number(),
        duration: z.number().nullish(),
        action: z.enum(['playing', 'paused']).nullish(),
      })
    )
    .meta({
      openapi: {
        method: 'PUT',
        alternativePath: '/api/progress/by-external-id',
      },
    })
    .query(async ({ input, ctx }) => {
      const { userId } = ctx;

      const { mediaItem, episode } =
        (await findMediaItemOrEpisode({
          userId,
          ...input,
        })) || {};

      if (!mediaItem) {
        return;
      }

      logger.debug(
        h`settings progress of ${mediaItem.title}${
          episode ? ` ${episode.seasonNumber}x${episode.episodeNumber}` : ''
        } (id: ${mediaItem.id}) at ${(input.progress * 100).toFixed(
          2
        )}% for user ${userId}`
      );

      await progressRepository.set({
        userId,
        mediaItemId: mediaItem.id,
        episodeId: episode?.id || null,
        progress: input.progress,
        duration: input.duration,
        action: input.action,
        device: input.device,
      });
    }),
});
