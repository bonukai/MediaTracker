import _ from 'lodash';
import { z } from 'zod';

import { ratingRepository } from '../repository/ratingRepository.js';
import { protectedProcedure, router } from '../router.js';
import { logger } from '../logger.js';
import { h } from '../utils.js';

export const ratingRouter = router({
  rate: protectedProcedure
    .input(
      z.object({
        mediaItemId: z.number(),
        seasonId: z.number().nullable(),
        episodeId: z.number().nullable(),
        rating: z.object({
          rating: z.number().min(1).max(10).nullish(),
          review: z.string().nullish(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { mediaItemId, seasonId, episodeId, rating } = input;
      const { userId } = ctx;

      logger.debug(
        h`user ${userId} rated mediaItem: ${mediaItemId}, season: ${seasonId}, episode: ${episodeId}. Rating: ${rating.rating}, review: ${rating.review}`
      );

      if (rating.rating === undefined && rating.review === undefined) {
        logger.debug(`nothing to set/update`);
        return;
      }

      await ratingRepository.rate({
        mediaItemId,
        seasonId,
        episodeId,
        userId,
        rating: rating.rating,
        review: rating.review,
      });
    }),
  delete: protectedProcedure
    .input(
      z.object({
        ratingId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { ratingId } = input;
      const { userId } = ctx;

      await ratingRepository.delete({ ratingId, userId });
    }),
});
