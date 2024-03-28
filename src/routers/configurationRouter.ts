import { z } from 'zod';
import { configurationJsonSchema } from '../entity/configurationModel.js';
import { configurationRepository } from '../repository/configurationRepository.js';
import {
  adminOnlyProtectedProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from '../router.js';
import { StaticConfiguration } from '../staticConfiguration.js';

export const configurationRouter = router({
  get: protectedProcedure.query(async () => {
    return await configurationRepository.get();
  }),
  getPublic: publicProcedure
    .output(
      z.object({
        demoMode: z.boolean(),
        enableRegistration: z.boolean(),
        hasIgdbCredentials: z.boolean(),
        publicAddress: z.string().nullable(),
      })
    )
    .query(async () => {
      const configuration = await configurationRepository.get();

      return {
        demoMode: StaticConfiguration.demoMode,
        enableRegistration: configuration.enableRegistration,
        hasIgdbCredentials:
          typeof configuration.igdbClientId === 'string' &&
          configuration.igdbClientId.length > 0 &&
          typeof configuration.igdbClientSecret === 'string' &&
          configuration.igdbClientSecret.length > 0,
        publicAddress: configuration.publicAddress || null,
      };
    }),
  update: adminOnlyProtectedProcedure
    .input(configurationJsonSchema)
    .mutation(async ({ input }) => {
      await configurationRepository.update(input);
    }),
});
