import _ from 'lodash';
import { string, z } from 'zod';

import { Database } from '../database.js';
import { mediaItemRepository } from '../repository/mediaItemRepository.js';
import { protectedProcedure, router } from '../router.js';
import { updateMetadata } from '../updateMetadata.js';
import {
  mediaItemResponseSchema,
  mediaTypeSchema,
} from '../entity/mediaItemModel.js';
import {
  paginatedInputSchema,
  paginatedOutputSchema,
} from '../entity/paginatedModel.js';

export const mediaItemRouter = router({
  details: protectedProcedure
    .input(z.object({ mediaItemId: z.number() }))
    .query(async ({ input, ctx }) => {
      const { mediaItemId } = input;
      const { userId } = ctx;

      await mediaItemRepository.updateMetadataIfNeeded({ mediaItemId });

      return mediaItemRepository.details({ mediaItemId, userId });
    }),
  updateMetadata: protectedProcedure
    .input(z.object({ mediaItemId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { mediaItemId } = input;

      const mediaItem = await Database.knex('mediaItem')
        .where('id', mediaItemId)
        .first();

      if (!mediaItem) {
        throw new Error(`No mediaItem with id ${mediaItemId}`);
      }

      await updateMetadata(mediaItem);
    }),
  find: protectedProcedure
    .meta({ openapi: { method: 'GET' } })
    .input(
      z.object({
        title: z.string(),
        releaseYear: z.number().nullish(),
        mediaType: mediaTypeSchema,
      })
    )
    .query(async ({ input }) => {
      const { title, releaseYear, mediaType } = input;

      return {
        title: 'test',
      };
    }),
  unrated: protectedProcedure
    .meta({ openapi: { method: 'GET' } })
    .input(
      z.object({
        ...paginatedInputSchema.shape,
        // filters: z
        //   .object({ mediaType: z.array(mediaTypeSchema).nullish() })
        //   .nullish(),
      })
    )
    .output(paginatedOutputSchema(mediaItemResponseSchema))
    .query(async ({ input, ctx }) => {
      const { page, numberOfItemsPerPage } = input;
      const { userId } = ctx;

      return mediaItemRepository.unrated({
        userId,
        page,
        numberOfItemsPerPage,
      });
    }),
});
