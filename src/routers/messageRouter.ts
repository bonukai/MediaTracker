import _ from 'lodash';
import { z } from 'zod';

import { protectedProcedure, router } from '../router.js';
import { messageRepository } from '../repository/messageRepository.js';

export const messageRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const { userId } = ctx;

    await messageRepository.get({ userId });
  }),
  getNumberOfUnreadMessages: protectedProcedure.query(async ({ ctx }) => {
    const { userId } = ctx;

    await messageRepository.getNumberOfUnreadMessages({ userId });
  }),
  markAsRead: protectedProcedure
    .input(
      z.object({
        id: z.array(z.number()),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { id } = input;

      await messageRepository.markAsRead({ userId, id });
    }),
  delete: protectedProcedure
    .input(
      z.object({
        id: z.array(z.number()),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { id } = input;

      await messageRepository.delete({ userId, id });
    }),
});
