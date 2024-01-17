import _ from 'lodash';
import { z } from 'zod';

import { notificationPlatformsSchemas } from '../notifications/notificationPlatforms.js';
import {
  listItemsFiltersModel,
  listSortBySchema,
  listSortOrderSchema,
} from './listModel.js';

export const userModelSchema = z.object({
  id: z.number(),
  name: z.string(),
  password: z.string(),
  admin: z.coerce.boolean().nullish(),
  publicReviews: z.coerce.boolean().nullish(),
  sendNotificationWhenStatusChanges: z.coerce.boolean().nullish(),
  sendNotificationWhenReleaseDateChanges: z.coerce.boolean().nullish(),
  sendNotificationWhenNumberOfSeasonsChanges: z.coerce.boolean().nullish(),
  sendNotificationForReleases: z.coerce.boolean().nullish(),
  sendNotificationForEpisodesReleases: z.coerce.boolean().nullish(),
  preferencesJson: z.string().nullish(),
});

export const languageSchema = z.enum([
  'da',
  'de',
  'en',
  'es',
  'fr',
  'ko',
  'pt',
]);

export const userPreferencesSchema = z.object({
  hideOverviewForUnseenSeasons: z.coerce.boolean(),
  hideEpisodeTitleForUnseenEpisodes: z.coerce.boolean(),
  ratingSystem: z.enum(['5-stars', '10-stars']).default('5-stars'),
  language: languageSchema.default('en'),
  showCategoryTv: z.boolean().default(true),
  showCategoryMovie: z.boolean().default(true),
  showCategoryBook: z.boolean().default(true),
  showCategoryAudiobook: z.boolean().default(true),
  showCategoryVideoGame: z.boolean().default(true),

  // notificationPlatforms: z
  //   .object(
  //     _(notificationPlatformsSchemas)
  //       .map((item) => ({
  //         platformName: item.platformName,
  //         schema: z
  //           .object({
  //             enabled: z.boolean(),
  //             credentials: item.credentialSchema.nullish(),
  //           })
  //           .nullish(),
  //       }))
  //       .keyBy((item) => item.platformName)
  //       .mapValues((item) => item.schema)
  //       .value()
  //   )
  //   .default({}),
});

export const userResponseSchema = z.object({
  ...userModelSchema.omit({ password: true, preferencesJson: true }).shape,
  preferences: userPreferencesSchema,
});

export type UserModel = z.infer<typeof userModelSchema>;
export type UserPreferences = z.infer<typeof userPreferencesSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
