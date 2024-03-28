import { z } from 'zod';
import {
  listItemsFiltersModel,
  listSortBySchema,
  listSortOrderSchema,
} from './listModel.js';

export const homeSectionModelSchema = z.object({
  id: z.number(),
  userId: z.number(),
  listId: z.number().nullable(),
  position: z.number(),
  name: z.string(),
  configurationJson: z.string(),
});

export const homeScreenBuiltinSectionNameSchema = z.enum([
  'builtin-section-upcoming',
  'builtin-section-recently-released',
  'builtin-section-next-episode-to-watch',
  'builtin-section-unrated',
]);

export const homeSectionConfigSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('builtin'),
    hidden: z.boolean().default(false),
    name: homeScreenBuiltinSectionNameSchema,
  }),
  z.object({
    type: z.literal('list-view'),
    hidden: z.boolean().default(false),
    name: z.string(),
    sortOrder: listSortOrderSchema.optional(),
    orderBy: listSortBySchema.optional(),
    filters: listItemsFiltersModel.optional(),
    listId: z.number(),
    numberOfItems: z.number().min(1).max(100).default(6),
  }),
]);

export const homeSectionResponseSchema = z.object({
  id: z.number(),
  config: homeSectionConfigSchema,
});

export type HomeSectionModel = z.infer<typeof homeSectionModelSchema>;
export type HomeScreenBuiltinSectionName = z.infer<
  typeof homeScreenBuiltinSectionNameSchema
>;
export type HomeSectionConfig = z.infer<typeof homeSectionConfigSchema>;
export type HomeSectionResponse = z.infer<typeof homeSectionResponseSchema>;
