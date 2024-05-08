import { exportRepository } from '../repository/exportRepository.js';
import { protectedProcedure, router } from '../router.js';

export const exportRouter = router({
  json: protectedProcedure.mutation(async ({ ctx }) => {
    const { userId } = ctx;

    return await exportRepository.exportJson({ userId });
  }),
});
