import { z } from 'zod';

import { protectedProcedure, router } from '../router.js';
import { accessTokenRepository } from '../repository/accessTokenRepository.js';
import {
  accessTokenCreatedBySchema,
  accessTokenModelSchema,
  accessTokenScopeSchema,
} from '../entity/accessTokenModel.js';

export const applicationTokenRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(3),
        scope: accessTokenScopeSchema.nullish(),
        createdBy: accessTokenCreatedBySchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { name, scope, createdBy } = input;
      const { userId } = ctx;

      return await accessTokenRepository.create({
        name,
        userId,
        scope: scope || undefined,
        createdBy,
      });
    }),
  delete: protectedProcedure
    .input(z.object({ tokenId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { tokenId } = input;
      const { userId } = ctx;

      return await accessTokenRepository.delete({ userId, tokenId });
    }),
  getAll: protectedProcedure
    .output(
      z.array(
        accessTokenModelSchema.pick({
          createdAt: true,
          description: true,
          id: true,
          lastUsedAt: true,
          scope: true,
        })
      )
    )
    .query(async ({ ctx }) => {
      const { userId } = ctx;

      return accessTokenRepository.getAll({ userId });
    }),
});
