import { z } from 'zod';

export const hasBeenSeenModelSchema = z.object({
  userId: z.number(),
  mediaItemId: z.number(),
});

export type HasBeenSeenModel = z.infer<typeof hasBeenSeenModelSchema>;
