import _ from 'lodash';
import { z } from 'zod';

import {
  MediaItemMetadata,
  mediaItemResponseSchema,
  mediaTypeSchema,
} from '../entity/mediaItemModel.js';
import { logger } from '../logger.js';
import { metadataProviders } from '../metadata/metadataProviders.js';
import { TmdbMovie } from '../metadata/provider/tmdbMovie.js';
import { TmdbTv } from '../metadata/provider/tmdbTv.js';
import { mediaItemRepository } from '../repository/mediaItemRepository.js';
import { protectedProcedure, router } from '../router.js';
import { h } from '../utils.js';
import { Database } from '../database.js';

const toString = (object: object) => {
  return JSON.stringify(
    _(object).omitBy(_.isUndefined).omitBy(_.isNull).value()
  );
};

export const searchRouter = router({
  search: protectedProcedure
    .input(
      z.object({
        query: z.object({
          query: z.string().nullish(),
          author: z.string().nullish(),
          narrator: z.string().nullish(),
          imdbId: z.string().nullish(),
          tmdbId: z.number().nullish(),
        }),
        mediaType: mediaTypeSchema,
      })
    )
    .output(z.array(mediaItemResponseSchema))
    .query(async ({ input, ctx }) => {
      const { query, mediaType } = input;

      const search = async () => {
        if (query.imdbId && mediaType === 'tv') {
          logger.debug(
            h`searching TMDB for a Tv Show by imdb: ${query.imdbId}`
          );
          return [await TmdbTv.findByImdbId(query.imdbId)];
        } else if (query.imdbId && mediaType === 'movie') {
          logger.debug(h`searching TMDB for a movie by imdb: ${query.imdbId}`);
          return [await TmdbMovie.findByImdbId(query.imdbId)];
        } else if (query.tmdbId && mediaType === 'tv') {
          logger.debug(
            h`searching TMDB for a Tv Show by tmdb: ${query.tmdbId}`
          );
          return [await TmdbTv.findByTmdbId(query.tmdbId)];
        } else if (query.tmdbId && mediaType === 'movie') {
          logger.debug(h`searching TMDB for a movie by tmdb: ${query.tmdbId}`);
          return [await TmdbMovie.findByTmdbId(query.tmdbId)];
        }

        const metadataProvider = metadataProviders.get(mediaType);

        if (!metadataProvider) {
          throw new Error(
            h`no metadata provider for media type "${mediaType}"`
          );
        }

        logger.debug(
          h`searching ${metadataProvider.name} for "${toString(
            query
          )}", mediaType: "${mediaType}"`
        );

        return await metadataProvider.search(query);
      };

      const searchResult = await search();

      const res = await mediaItemRepository.addManyMediaItems({
        mediaItems: searchResult.filter(
          (item): item is MediaItemMetadata => typeof item === 'object'
        ),
        mediaType: mediaType,
      });

      const { getMediaItemById } = await mediaItemRepository.userDetails({
        userId: ctx.userId,
        mediaItemIds: res.map((item) => item.id),
      });

      logger.debug(h`found ${searchResult.length} items`);

      return res.map((mediaItem) =>
        mediaItemResponseSchema.parse(getMediaItemById(mediaItem.id))
      );
    }),
  searchLocalDatabase: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        mediaType: mediaTypeSchema,
      })
    )
    .output(z.array(mediaItemResponseSchema))
    .query(async ({ input, ctx }) => {
      const { userId } = ctx;
      const { title, mediaType } = input;

      const res = await Database.knex.transaction(async (trx) => {
        const searchResult = await trx('mediaItem')
          .where('mediaType', mediaType)
          .whereLike('title', `%${title}%`)
          .limit(40);

        const userDetails = await mediaItemRepository.userDetails({
          trx,
          userId: userId,
          mediaItemIds: searchResult.map((item) => item.id),
        });

        return { searchResult, userDetails };
      });

      return res.searchResult.map((mediaItem) =>
        mediaItemResponseSchema.parse(
          res.userDetails.getMediaItemById(mediaItem.id)
        )
      );
    }),
});
