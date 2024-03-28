import _ from 'lodash';
import { z } from 'zod';

import { watchlistRepository } from '../repository/watchlistRepository.js';
import { protectedProcedure, router } from '../router.js';

export const watchlistRouter = router({
  add: protectedProcedure
    .input(
      z.object({
        mediaItemId: z.number(),
        seasonId: z.number().nullable(),
        episodeId: z.number().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { userId } = ctx;

      await watchlistRepository.addItem({
        ...input,
        userId,
      });
    }),
  delete: protectedProcedure
    .input(
      z.object({
        mediaItemId: z.number(),
        seasonId: z.number().nullable(),
        episodeId: z.number().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { userId } = ctx;

      await watchlistRepository.deleteItem({
        ...input,
        userId,
      });
    }),
  get: protectedProcedure.query(async ({ input, ctx }) => {
    return await watchlistRepository.get({ userId: ctx.userId });
  }),
});
