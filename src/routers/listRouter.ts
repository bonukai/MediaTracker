import { z } from 'zod';

import { TRPCError } from '@trpc/server';

import { listRepository } from '../repository/listRepository.js';
import { protectedProcedure, router } from '../router.js';
import { parseISO } from 'date-fns';
import { itemTypeSchema } from '../entity/mediaItemModel.js';
import { rssBuilder } from '../rssBuilder.js';
import { getConfiguration } from '../repository/configurationRepository.js';
import {
  createListArgsSchema,
  listItemResponseSchema,
  listItemsFiltersModel,
  listSortBySchema,
  listSortOrderSchema,
} from '../entity/listModel.js';
import {
  paginatedInputSchema,
  paginatedOutputSchema,
} from '../entity/paginatedModel.js';
import { listItemRepository } from '../repository/listItemRepository.js';
import { logger } from '../logger.js';

export const listRouter = router({
  getUserLists: protectedProcedure.query(async ({ ctx }) => {
    return await listRepository.getLists({
      userId: ctx.userId,
    });
  }),
  getList: protectedProcedure
    .input(
      z.object({
        listId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { userId } = ctx;
      const { listId } = input;

      return await listRepository.getList({
        userId: userId,
        listId: listId,
      });
    }),
  addItemToList: protectedProcedure
    .input(
      z.object({
        listId: z.number(),
        mediaItemId: z.number(),
        seasonId: z.number().nullable(),
        episodeId: z.number().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { userId } = ctx;
      const { listId, mediaItemId, seasonId, episodeId } = input;

      return await listItemRepository.addItem({
        userId,
        listId,
        mediaItemId,
        seasonId,
        episodeId,
      });
    }),
  removeItemFromList: protectedProcedure
    .input(
      z.object({
        listId: z.number(),
        mediaItemId: z.number(),
        seasonId: z.number().nullable(),
        episodeId: z.number().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { userId } = ctx;
      const { listId, mediaItemId, seasonId, episodeId } = input;

      return await listItemRepository.deleteItem({
        userId,
        listId,
        mediaItemId,
        seasonId,
        episodeId,
      });
    }),
  createList: protectedProcedure
    .input(createListArgsSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;

      await listRepository.createList({
        name: input.name,
        description: input.description || '',
        privacy: input.privacy,
        sortBy: input.sortBy,
        sortOrder: input.sortOrder,
        isWatchlist: false,
        userId,
      });
    }),
  updateList: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        list: createListArgsSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { id, list } = input;

      await listRepository.updateList({
        id: id,
        name: list.name,
        description: list.description || '',
        privacy: list.privacy,
        sortBy: list.sortBy,
        sortOrder: list.sortOrder,
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
      const { id } = input;

      await listRepository.deleteList({
        listId: id,
        userId,
      });
    }),
  share: protectedProcedure
    .input(
      z.object({
        listId: z.number(),
        userId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { listId } = input;

      // await listRepository.deleteList({
      //   listId: id,
      //   userId,
      // });
    }),
  getListItemsPaginated: protectedProcedure
    .meta({ openapi: { method: 'GET' } })
    .input(
      z.object({
        ...paginatedInputSchema.shape,
        listId: z.coerce.number(),
        sortOrder: listSortOrderSchema.optional(),
        orderBy: listSortBySchema.optional(),
        filters: listItemsFiltersModel.optional(),
      })
    )
    .output(paginatedOutputSchema(listItemResponseSchema))
    .query(async ({ input, ctx }) => {
      const { userId } = ctx;
      const {
        listId,
        page,
        numberOfItemsPerPage,
        sortOrder,
        orderBy,
        filters,
      } = input;

      return await listRepository.getListItemsPaginated({
        listId,
        userId,
        page,
        numberOfItemsPerPage,
        sortOrder,
        orderBy,
        filters,
      });
    }),
  getListItems: protectedProcedure
    .meta({ openapi: { method: 'GET' } })
    .input(z.object({ listId: z.coerce.number() }))
    .query(async ({ input, ctx }) => {
      const { userId } = ctx;
      const { listId } = input;

      return listItemsHandler({ userId, listId });
    }),
  getListItemsRss: protectedProcedure
    .meta({ openapi: { method: 'GET', contentType: 'application/xml' } })
    .input(
      z.object({
        listId: z.coerce.number(),
        itemType: itemTypeSchema.optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { userId } = ctx;
      const { listId, itemType } = input;

      const list = await listItemsHandler({ userId, listId });

      const configuration = await getConfiguration();

      return rssBuilder({
        channel: {
          title: list.name,
          description: list.description || undefined,
        },
        items: list.items
          .filter((item) =>
            itemType ? item.mediaItem.mediaType === itemType : true
          )
          .map((item) => ({
            title: item.mediaItem.title,
            description: item.mediaItem.overview || undefined,
            guid: item.id.toString(),
            pubDate:
              typeof item.mediaItem.releaseDate === 'string'
                ? parseISO(item.mediaItem.releaseDate)
                : undefined,
            enclosure:
              item.mediaItem.poster && configuration.publicAddress
                ? {
                    url: new URL(
                      item.mediaItem.poster,
                      configuration.publicAddress
                    ).href,
                    length: 0,
                    type: 'image/webp',
                  }
                : undefined,
          })),
      });
    }),
});

const listItemsHandler = async (args: { listId: number; userId: number }) => {
  const { listId, userId } = args;

  const listItems = await listRepository.getListItems({
    userId: userId,
    listId: listId,
  });

  if (
    listItems &&
    listItems.privacy === 'private' &&
    listItems.user.id !== userId
  ) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'this list is private',
    });
  }

  return listItems;
};
