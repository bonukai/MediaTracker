import { z } from 'zod';

export const messageModelSchema = z.object({
  id: z.number(),
  userId: z.number(),
  read: z.boolean(),
  message: z.string(),
  createdAt: z.number(),
});

export type MessageModel = z.infer<typeof messageModelSchema>;
