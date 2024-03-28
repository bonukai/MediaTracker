import { z } from 'zod';

import {
  HomeScreenBuiltinSectionName,
  homeSectionConfigSchema,
  homeSectionResponseSchema,
} from '../entity/homeSectionModel.js';
import {
  EpisodeResponse,
  episodeResponseSchema,
  MediaItemResponse,
  mediaItemResponseSchema,
  SeasonResponse,
  seasonResponseSchema,
} from '../entity/mediaItemModel.js';
import { homeSectionRepository } from '../repository/homeSectionRepository.js';
import { listRepository } from '../repository/listRepository.js';
import { mediaItemRepository } from '../repository/mediaItemRepository.js';
import { watchlistRepository } from '../repository/watchlistRepository.js';
import { protectedProcedure, router } from '../router.js';

export const homeSectionRouter = router({
  get: protectedProcedure
    .output(z.array(homeSectionResponseSchema))
    .query(async ({ ctx }) => {
      const { userId } = ctx;

      return await homeSectionRepository.get(userId);
    }),
  move: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        direction: z.enum(['up', 'down']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { id, direction } = input;

      await homeSectionRepository.move({ userId, id, direction });
    }),
  update: protectedProcedure
    .input(homeSectionResponseSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const section = input;

      await homeSectionRepository.update({
        ...section,
        userId,
      });
    }),
  delete: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;

      await homeSectionRepository.delete({ userId, sectionId: input.id });
    }),
  create: protectedProcedure
    .input(homeSectionConfigSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;

      await homeSectionRepository.create({
        userId,
        config: input,
      });
    }),
  homePageItems: protectedProcedure
    .output(
      z.array(
        z.object({
          id: z.number(),
          section: homeSectionConfigSchema,
          items: z.array(
            z.object({
              mediaItem: mediaItemResponseSchema,
              season: seasonResponseSchema.nullable(),
              episode: episodeResponseSchema.nullable(),
            })
          ),
        })
      )
    )
    .query(async ({ ctx }) => {
      const { userId } = ctx;

      const watchlist = await watchlistRepository.get({ userId });
      const homeSections = await homeSectionRepository.get(userId);

      return (
        await Promise.all(
          homeSections
            .filter((item) => item.config.hidden !== true)
            .map(async (item) => ({
              id: item.id,
              section: item.config,
              items:
                item.config.type === 'list-view'
                  ? (
                      await listRepository.getListItemsPaginated({
                        userId,
                        page: 1,
                        numberOfItemsPerPage: item.config.numberOfItems,
                        listId: item.config.listId,
                        orderBy: item.config.orderBy,
                        sortOrder: item.config.sortOrder,
                        filters: item.config.filters,
                      })
                    ).items
                  : await getListItems({
                      name: item.config.name,
                      userId,
                      watchlistId: watchlist.id,
                      numberOfItems: 6,
                    }),
            }))
        )
      ).filter((item) => item.items.length > 0);
    }),
});

const getListItems = async (args: {
  name: HomeScreenBuiltinSectionName;
  userId: number;
  watchlistId: number;
  numberOfItems: number;
}): Promise<
  {
    mediaItem: MediaItemResponse;
    season: SeasonResponse | null;
    episode: EpisodeResponse | null;
  }[]
> => {
  const { name, userId, watchlistId, numberOfItems } = args;
  switch (name) {
    case 'builtin-section-upcoming':
      return (
        await listRepository.getListItemsPaginated({
          userId,
          page: 1,
          numberOfItemsPerPage: numberOfItems,
          listId: watchlistId,
          sortOrder: 'asc',
          orderBy: 'next-airing',
        })
      ).items;
    case 'builtin-section-recently-released':
      return (
        await listRepository.getListItemsPaginated({
          userId,
          page: 1,
          numberOfItemsPerPage: numberOfItems,
          listId: watchlistId,
          sortOrder: 'desc',
          orderBy: 'last-airing',
          filters: {
            seen: false,
          },
        })
      ).items;
    case 'builtin-section-next-episode-to-watch':
      return (
        await listRepository.getListItemsPaginated({
          userId,
          page: 1,
          numberOfItemsPerPage: numberOfItems,
          listId: watchlistId,
          sortOrder: 'desc',
          orderBy: 'last-seen',
          filters: {
            itemTypes: ['tv'],
            seen: false,
          },
        })
      ).items;
    case 'builtin-section-unrated':
      return (
        await mediaItemRepository.unrated({
          page: 1,
          numberOfItemsPerPage: numberOfItems,
          userId,
        })
      ).items.map((item) => ({
        mediaItem: item,
        season: null,
        episode: null,
      }));
  }
};
