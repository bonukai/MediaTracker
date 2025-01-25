import { z } from 'zod';
import { mediaTypeSchema } from './mediaItemModel.js';

export const serverInternalSettingsModelSchema = z.object({
  id: z.number(),
  settingsJson: z.string(),
});

export const serverInternalSettingsJsonSchema = z.object({
  tmdbTvPreviousTimeForChangesCheck: z.date({ coerce: true }).nullish(),
  tmdbMoviePreviousTimeForChangesCheck: z.date({ coerce: true }).nullish(),
  sessionKey: z.object({
    key: z.string(),
    createdAt: z.number().nullable(),
  }),
  previousTimesForChangesCheck: z
    .record(mediaTypeSchema, z.date({ coerce: true }))
    .nullish(),
});

export type ServerInternalSettingsJson = z.infer<
  typeof serverInternalSettingsJsonSchema
>;
export type ServerInternalSettingsModel = z.infer<
  typeof serverInternalSettingsModelSchema
>;
