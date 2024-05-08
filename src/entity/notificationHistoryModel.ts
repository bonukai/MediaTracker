import { z } from 'zod';

export const notificationHistoryModelSchema = z.object({
  id: z.number(),
  mediaItemId: z.number(),
  episodeId: z.number().nullish(),
  sendDate: z.number(),
});

export type NotificationHistoryModel = z.infer<
  typeof notificationHistoryModelSchema
>;
