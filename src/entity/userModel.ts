import _ from 'lodash';
import { z } from 'zod';
import { Discord } from '../notifications/platforms/discord.js';
import { gotify } from '../notifications/platforms/gotify.js';
import { ntfy } from '../notifications/platforms/ntfy.js';
import { Pushbullet } from '../notifications/platforms/pushbullet.js';
import { Pushover } from '../notifications/platforms/pushover.js';
import { Pushsafer } from '../notifications/platforms/pushsafer.js';

export const userModelSchema = z.object({
  id: z.number(),
  name: z.string(),
  password: z.string(),
  admin: z.coerce.boolean().nullish(),
  publicReviews: z.coerce.boolean().nullish(),
  preferencesJson: z.string().nullish(),
  notificationPlatformsJson: z.string().nullish(),
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

export const notificationPlatformSchema = z.discriminatedUnion('name', [
  z.object({
    name: z.literal(gotify.name),
    credentials: gotify.credentialsSchema,
  }),
  z.object({
    name: z.literal(Discord.name),
    credentials: Discord.credentialsSchema,
  }),
  z.object({
    name: z.literal(Pushbullet.name),
    credentials: Pushbullet.credentialsSchema,
  }),
  z.object({
    name: z.literal(Pushover.name),
    credentials: Pushover.credentialsSchema,
  }),
  z.object({
    name: z.literal(Pushsafer.name),
    credentials: Pushsafer.credentialsSchema,
  }),
  z.object({
    name: z.literal(ntfy.name),
    credentials: ntfy.credentialsSchema,
  }),
]);

export const userPreferencesSchema = z.object({
  sendNotificationForReleases: z.coerce.boolean().nullish(),
  hideOverviewForUnseenSeasons: z.coerce.boolean(),
  hideEpisodeTitleForUnseenEpisodes: z.coerce.boolean(),
  ratingSystem: z.enum(['5-stars', '10-stars']).default('5-stars'),
  language: languageSchema.default('en'),
  showCategoryTv: z.boolean().default(true),
  showCategoryMovie: z.boolean().default(true),
  showCategoryBook: z.boolean().default(true),
  showCategoryAudiobook: z.boolean().default(true),
  showCategoryVideoGame: z.boolean().default(true),
});

export const notificationPlatformsSchema = z
  .array(
    notificationPlatformSchema.and(
      z.object({
        id: z.string(),
        addedAt: z.number().nullable(),
        description: z.string().nullable(),
      })
    )
  )
  .default([]);

export const userResponseSchema = z.object({
  ...userModelSchema.omit({ password: true, preferencesJson: true }).shape,
  preferences: userPreferencesSchema,
  notificationPlatforms: notificationPlatformsSchema,
});

export type UserModel = z.infer<typeof userModelSchema>;
export type UserPreferences = z.infer<typeof userPreferencesSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type NotificationPlatform = z.infer<typeof notificationPlatformSchema>;
