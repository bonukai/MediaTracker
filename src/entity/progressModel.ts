import { z } from 'zod';

export const progressModelSchema = z.object({
  id: z.number(),
  date: z.number(),
  mediaItemId: z.number(),
  episodeId: z.number().nullish(),
  userId: z.number(),
  progress: z.number(),
  duration: z.number().nullish(),
  action: z.enum(['paused', 'playing']).nullish(),
  device: z.string().nullish(),
});

export type ProgressModel = z.infer<typeof progressModelSchema>;
