import _ from 'lodash';
import { z } from 'zod';

import { protectedProcedure, router } from '../router.js';
import { justWatchRepository } from '../repository/justWatchRepository.js';
import { justWatchProviderResponseSchema } from '../entity/justWatchModel.js';

export const justWatchProviderRouter = router({
  getAll: protectedProcedure
    .output(z.array(justWatchProviderResponseSchema))
    .query(async () => {
      return await justWatchRepository.getAll();
    }),
});
