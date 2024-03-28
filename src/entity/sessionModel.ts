import { z } from 'zod';

export const sessionModelSchema = z.object({
  sid: z.string(),
  userId: z.number(),
  expiresAt: z.number(),
});

export type SessionModel = z.infer<typeof sessionModelSchema>;
