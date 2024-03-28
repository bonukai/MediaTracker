import { z } from 'zod';
import { ISO_3166_1_schema } from './configurationModel.js';

export const justWatchProviderModelSchema = z.object({
  id: z.number(),
  name: z.string(),
  externalLogoUrl: z.string(),
  logo: z.string(),
});

export const justWatchProviderResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  logo: z.string(),
});

export const justWatchAvailabilityTypeSchema = z.enum([
  'buy',
  'rent',
  'flatrate',
]);

export const justWatchAvailabilityModelSchema = z.object({
  id: z.number(),
  providerId: z.number(),
  mediaItemId: z.number(),
  displayPriority: z.number(),
  type: justWatchAvailabilityTypeSchema,
  country: ISO_3166_1_schema,
});

export const justWatchAvailabilitySchema = z.object({
  provider: justWatchProviderModelSchema.omit({ logo: true }),
  displayPriority: z.number(),
  type: justWatchAvailabilityTypeSchema,
  country: ISO_3166_1_schema,
});

export type JustWatchProviderModel = z.infer<
  typeof justWatchProviderModelSchema
>;
export type JustWatchAvailabilityModel = z.infer<
  typeof justWatchAvailabilityModelSchema
>;

export type JustWatchAvailability = z.infer<typeof justWatchAvailabilitySchema>;
export type JustWatchAvailabilityType = z.infer<
  typeof justWatchAvailabilityTypeSchema
>;
export type JustWatchProviderResponse = z.infer<
  typeof justWatchProviderResponseSchema
>;
