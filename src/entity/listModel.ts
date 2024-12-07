import { z } from 'zod';

import {
  episodeResponseSchema,
  itemTypeSchema,
  mediaItemResponseSchema,
  seasonResponseSchema,
} from './mediaItemModel.js';

export const listPrivacySchema = z.union([
  z.literal('public'),
  z.literal('private'),
  z.literal('friends'),
]);

export const listSortOrderSchema = z.union([
  z.literal('asc'),
  z.literal('desc'),
]);

export const listSortBySchema = z.union([
  z.literal('listed'),
  z.literal('status'),
  z.literal('user-rating'),
  z.literal('unseen-episodes-count'),
  z.literal('recently-added'),
  z.literal('recently-watched'),
  z.literal('recently-aired'),
  z.literal('next-airing'),
  z.literal('last-airing'),
  z.literal('release-date'),
  z.literal('runtime'),
  z.literal('progress'),
  z.literal('title'),
  z.literal('last-seen'),
  z.literal('media-type'),
]);

export const listItemsFiltersModel = z.object({
  itemTypes: z
    .array(itemTypeSchema)
    .min(1, 'itemTypes should contain at least one itemType')
    .optional(),
  withUserRating: z.boolean().optional(),
  seen: z.boolean().optional(),
  inProgress: z.boolean().optional(),
  onlyWithNextAiring: z.boolean().optional(),
  onlyWithLastAiring: z.boolean().optional(),
  justWatchProviders: z
    .array(z.number())
    .min(1, 'justWatchProviders should contain at least one justWatchProvider')
    .optional(),
  title: z.string().optional(),
});

export const listModelSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  privacy: listPrivacySchema,
  sortBy: listSortBySchema,
  sortOrder: listSortOrderSchema,
  createdAt: z.number(),
  updatedAt: z.number(),
  userId: z.number(),
  allowComments: z.coerce.boolean().nullable(),
  displayNumbers: z.coerce.boolean().nullable(),
  isWatchlist: z.coerce.boolean(),
  traktId: z.number().nullable(),
});

export const listItemModelSchema = z.object({
  id: z.number(),
  listId: z.number(),
  mediaItemId: z.number(),
  seasonId: z.number().nullable(),
  episodeId: z.number().nullable(),
  addedAt: z.number(),
});

export const listResponseSchema = z.object({
  numberOfItems: z.number(),
  ...listModelSchema.shape,
  user: z.object({
    id: z.number(),
    username: z.string(),
  }),
});

export const listItemResponseSchema = z.object({
  id: z.number(),
  addedAt: z.number(),
  type: z.enum(['mediaItem', 'season', 'episode']),
  mediaItem: mediaItemResponseSchema,
  season: seasonResponseSchema.nullable(),
  episode: episodeResponseSchema.nullable(),
});

export const listItemsResponseSchema = z.object({
  ...listResponseSchema.shape,
  items: z.array(listItemResponseSchema),
});

export const createListArgsSchema = listModelSchema.pick({
  description: true,
  name: true,
  sortBy: true,
  sortOrder: true,
  privacy: true,
});

export type ListPrivacy = z.infer<typeof listPrivacySchema>;
export type ListSortOrder = z.infer<typeof listSortOrderSchema>;
export type ListSortBy = z.infer<typeof listSortBySchema>;
export type ListModel = z.infer<typeof listModelSchema>;
export type ListItemModel = z.infer<typeof listItemModelSchema>;
export type ListResponse = z.infer<typeof listResponseSchema>;
export type ListItemsResponse = z.infer<typeof listItemsResponseSchema>;
export type ListItemResponse = z.infer<typeof listItemResponseSchema>;
export type ListItemsFilters = z.infer<typeof listItemsFiltersModel>;
export type CreateListArgs = z.infer<typeof createListArgsSchema>;
