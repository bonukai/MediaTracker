import { addMinutes } from 'date-fns';
import { customAlphabet, nanoid } from 'nanoid';
import { z } from 'zod';

import { protectedProcedure, publicProcedure, router } from '../router.js';

const codeRequests = new Map<
  string,
  {
    token?: string;
    userId?: number;
    expiresAt: Date;
  }
>();

export const authRouter = router({
  deviceCode: publicProcedure
    .input(z.object({ client_id: z.string() }))
    .mutation(async ({ input }) => {
      const deviceCode = customAlphabet('ABCDEFHGJKMNPQRSTUWXYZ123456789')(6);
      const expiresAt = addMinutes(new Date(), 5);

      codeRequests.set(deviceCode, {
        expiresAt,
      });

      return {
        deviceCode,
        expiresAt,
      };
    }),
  deviceToken: publicProcedure
    .input(z.object({ deviceCode: z.string() }))
    .mutation(async ({ input }) => {
      const { deviceCode } = input;

      const code = codeRequests.get(deviceCode);

      if (
        !code ||
        code.expiresAt < new Date() ||
        typeof code.userId !== 'number' ||
        !code.token
      ) {
        return;
      }

      return {
        token: code.token,
      };
    }),
  authenticateCode: protectedProcedure
    .input(z.object({ deviceCode: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { deviceCode } = input;
      const { userId } = ctx;
      const token = nanoid(128);

      const code = codeRequests.get(deviceCode);

      if (!code || code.expiresAt < new Date()) {
        return;
      }

      code.token = token;
      code.userId = userId;
    }),
});
