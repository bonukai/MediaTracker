import { z } from 'zod';

export const seenModelSchema = z.object({
  id: z.number(),
  date: z.number().nullish(),
  day: z.number().nullish(),
  month: z.number().nullish(),
  mediaItemId: z.number(),
  episodeId: z.number().nullish(),
  userId: z.number(),
  duration: z.number().nullish(),
});

export type SeenModel = z.infer<typeof seenModelSchema>;

export class SeenFilters {
  public static mediaItemSeenValue = (seen: SeenModel) => {
    return Boolean(!seen.episodeId);
  };

  public static episodeSeenValue = (seen: SeenModel) => {
    return Boolean(seen.episodeId);
  };
}
