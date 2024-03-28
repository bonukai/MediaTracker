import { protectedProcedure, router } from '../router.js';
import { MediaTrackerVersion } from '../version.js';

export const serverVersionRouter = router({
  get: protectedProcedure.query(async () => {
    return MediaTrackerVersion;
  }),
});
