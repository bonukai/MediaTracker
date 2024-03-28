import _ from 'lodash';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

import { logger } from '../logger.js';
import { configurationRepository } from '../repository/configurationRepository.js';
import { sessionRepository } from '../repository/sessionRepository.js';
import { userRepository } from '../repository/userRepository.js';
import {
  protectedProcedure,
  publicProcedure,
  router,
  SetCookieFunction,
} from '../router.js';
import { userPreferencesSchema } from '../entity/userModel.js';
import { h } from '../utils.js';

const usernameSchema = z.string().min(2).max(100);
const passwordSchema = z.string().min(2).max(1024);

export const userRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const { userId } = ctx;

    return await userRepository.get({ userId });
  }),
  login: publicProcedure
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await userRepository.verifyPassword(input);

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid username of password',
        });
      }

      await createAndSetSessionToken({
        userId: user.id,
        setCookie: ctx.setCookie,
      });

      logger.debug(h`user ${user.id} logged in via password`);
    }),
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    const cookie = ctx.getCookie('session');

    if (typeof cookie !== 'string') {
      throw new Error('invalid cookie');
    }

    await sessionRepository.delete({ cookie });

    ctx.removeCookie('session');
  }),
  register: publicProcedure
    .input(
      z.object({
        username: usernameSchema,
        password: passwordSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const configuration = await configurationRepository.get();

      if (configuration.enableRegistration !== true) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Registration is disabled',
        });
      }

      const user = await userRepository.create(input);

      await createAndSetSessionToken({
        userId: user.id,
        setCookie: ctx.setCookie,
      });

      logger.debug(h`created user ${user.name}`);
    }),
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: passwordSchema,
        newPassword: passwordSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      await userRepository.changePassword({
        userId: ctx.userId,
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      });

      logger.debug(h`user ${ctx.userId} changed password`);
    }),
  changePreferences: protectedProcedure
    .input(userPreferencesSchema.partial())
    .mutation(async ({ input, ctx }) => {
      await userRepository.updatePreferences({
        userId: ctx.userId,
        newPreferences: input,
      });

      logger.debug(h`user ${ctx.userId} changed preferences`);
    }),
  getUsersList: protectedProcedure
    .output(
      z.array(
        z.object({
          id: z.number(),
          name: z.string(),
        })
      )
    )
    .query(async () => {
      return await userRepository.getAllUsers();
    }),
});

const createAndSetSessionToken = async (args: {
  userId: number;
  setCookie: SetCookieFunction;
}) => {
  const sessionToken = nanoid(128);

  const session = await sessionRepository.create({
    cookie: sessionToken,
    userId: args.userId,
  });

  args.setCookie({
    name: 'session',
    value: sessionToken,
    expires: new Date(session.expiresAt),
  });
};
