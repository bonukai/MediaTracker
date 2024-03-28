import { z } from 'zod';

export const seenEpisodesCountModelSchema = z.object({
  userId: z.number(),
  mediaItemId: z.number(),
  seenEpisodesCount: z.number(),
});

export type SeenEpisodesCountModel = z.infer<
  typeof seenEpisodesCountModelSchema
>;
