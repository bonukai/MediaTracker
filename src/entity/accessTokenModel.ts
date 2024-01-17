import { z } from 'zod';

export const accessTokenScopeSchema = z.enum([
  'calendar',
  'listItems',
  'integration',
]);
export const accessTokenCreatedBySchema = z.enum(['user', 'system']);

export const accessTokenModelSchema = z.object({
  id: z.number(),
  userId: z.number(),
  token: z.string(),
  description: z.string(),
  scope: accessTokenScopeSchema.nullable(),
  createdAt: z.number(),
  lastUsedAt: z.number().nullable(),
  createdBy: accessTokenCreatedBySchema,
});

export type AccessTokenModel = z.infer<typeof accessTokenModelSchema>;
export type AccessTokenScope = z.infer<typeof accessTokenScopeSchema>;
export type AccessCreatedBy = z.infer<typeof accessTokenCreatedBySchema>;
