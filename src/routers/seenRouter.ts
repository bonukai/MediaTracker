import { z } from 'zod';

import { listSortOrderSchema } from '../entity/listModel.js';
import {
  episodeResponseSchema,
  mediaItemResponseSchema,
  mediaTypeSchema,
} from '../entity/mediaItemModel.js';
import {
  paginatedInputSchema,
  paginatedOutputSchema,
} from '../entity/paginatedModel.js';
import { findMediaItemOrEpisode } from '../findMediaItemOrEpisode.js';
import { logger } from '../logger.js';
import { seenRepository } from '../repository/seenRepository.js';
import { protectedProcedure, router } from '../router.js';
import { h } from '../utils.js';

export const seenRouter = router({
  markAsSeen: protectedProcedure
    .input(
      z.object({
        mediaItemId: z.number(),
        date: z.number().nullish(),
        duration: z.number().nullish(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { mediaItemId, date, duration } = input;
      const { userId } = ctx;

      logger.debug(
        h`user ${userId} added mediaItem ${mediaItemId} to seen history`
      );

      return await seenRepository.add({
        mediaItemId,
        userId,
        date,
        duration,
      });
    }),
  markEpisodesAsSeen: protectedProcedure
    .input(
      z.object({
        mediaItemId: z.number(),
        episodes: z.array(
          z.object({
            episodeId: z.number(),
            date: z.number().nullish(),
            duration: z.number().nullish(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { mediaItemId, episodes } = input;
      const { userId } = ctx;

      logger.debug(
        h`user ${userId} added ${episodes.length} episodes of tv show ${mediaItemId} to seen history`
      );

      return await seenRepository.addEpisodes({
        mediaItemId,
        userId,
        episodes,
      });
    }),
  delete: protectedProcedure
    .input(
      z.object({
        seenId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { userId } = ctx;
      const { seenId } = input;

      logger.debug(h`user ${userId} deleted seen entry ${seenId}`);

      await seenRepository.delete({
        userId,
        seenId,
      });
    }),
  deleteMany: protectedProcedure
    .input(
      z.array(
        z.object({
          seenId: z.number(),
        })
      )
    )
    .mutation(async ({ input, ctx }) => {
      const { userId } = ctx;

      logger.debug(h`user ${userId} deleted ${input.length} seen entries`);

      await seenRepository.deleteMany({
        data: input,
        userId,
      });
    }),
  getSeenCountByMonth: protectedProcedure
    .output(
      z.array(z.object({ count: z.number(), month: z.number().nullable() }))
    )
    .query(async ({ ctx }) => {
      const { userId } = ctx;

      return await seenRepository.getSeenCountByMonth({
        userId,
      });
    }),
  getSeenCountByDay: protectedProcedure
    .output(
      z.array(z.object({ count: z.number(), day: z.number().nullable() }))
    )
    .query(async ({ ctx }) => {
      const { userId } = ctx;

      return await seenRepository.getSeenCountByDay({
        userId,
      });
    }),
  getSeenHistory: protectedProcedure
    .input(
      z.object({
        ...paginatedInputSchema.shape,
      })
    )
    .output(
      paginatedOutputSchema(
        z.object({
          seenId: z.number(),
          seenAt: z.number().nullable(),
          duration: z.number().nullable(),
          mediaItem: mediaItemResponseSchema,
          episode: episodeResponseSchema.nullable(),
        })
      )
    )
    .query(async ({ ctx, input }) => {
      const { numberOfItemsPerPage, page } = input;
      const { userId } = ctx;

      return seenRepository.getHistoryPaginated({
        userId,
        page,
        numberOfItemsPerPage,
      });
    }),
  getSeenHistoryCursor: protectedProcedure
    .input(
      z.object({
        order: listSortOrderSchema,
        fromDate: z.number(),
        toDate: z.number(),
      })
    )
    .output(
      z.array(
        z.object({
          seenId: z.number(),
          seenAt: z.number().nullable(),
          duration: z.number().nullable(),
          mediaItem: mediaItemResponseSchema,
          episode: episodeResponseSchema.nullable(),
        })
      )
    )
    .query(async ({ ctx, input }) => {
      const { fromDate, toDate, order } = input;
      const { userId } = ctx;

      return seenRepository.getHistoryCursor({
        userId,
        fromDate,
        toDate,
        order,
      });
    }),
  markAsSeenByExternalId: protectedProcedure
    .input(
      z.object({
        mediaType: mediaTypeSchema,
        id: z.object({
          imdbId: z.string().nullish(),
          tmdbId: z.number().nullish(),
          tvdbId: z.coerce.number().nullish(),
        }),
        seasonNumber: z.number().nullish(),
        episodeNumber: z.number().nullish(),
        title: z.string().nullish(),
        releaseYear: z.number().nullish(),
        device: z.string().nullish(),
        duration: z.number().nullish(),
      })
    )
    .meta({
      openapi: {
        method: 'PUT',
        alternativePath: '/api/seen/by-external-id',
      },
    })
    .query(async ({ input, ctx }) => {
      const { userId } = ctx;

      const { mediaItem, episode } =
        (await findMediaItemOrEpisode({
          userId,
          ...input,
        })) || {};

      if (!mediaItem) {
        return;
      }

      logger.debug(
        h`adding ${mediaItem.title}${
          episode ? ` ${episode.seasonNumber}x${episode.episodeNumber}` : ''
        } (id: ${mediaItem.id}) to seen history of user ${userId}`
      );

      if (episode) {
        await seenRepository.addEpisodes({
          mediaItemId: mediaItem.id,
          episodes: [
            {
              episodeId: episode.id,
              date: new Date().getTime(),
              duration: input.duration,
            },
          ],
          userId,
        });
      } else {
        await seenRepository.add({
          mediaItemId: mediaItem.id,
          date: new Date().getTime(),
          duration: input.duration,
          userId,
        });
      }
    }),
});
