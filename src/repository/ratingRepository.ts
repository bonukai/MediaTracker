import { Database } from '../database.js';
import { isDefined } from '../utils.js';

export const ratingRepository = {
  async rate(args: {
    mediaItemId: number;
    episodeId: number | null;
    seasonId: number | null;
    userId: number;
    rating?: number | null;
    review?: string | null;
  }) {
    const { mediaItemId, seasonId, episodeId, userId, rating, review } = args;

    await Database.knex.transaction(async (trx) => {
      const existingRating = await trx('userRating')
        .where('mediaItemId', mediaItemId)
        .where('seasonId', seasonId)
        .where('episodeId', episodeId)
        .where('userId', userId)
        .first();

      if (existingRating) {
        await trx('userRating')
          .where('id', existingRating.id)
          .update({
            date: Date.now(),
            ...(rating === undefined ? {} : { rating }),
            ...(review === undefined ? {} : { review }),
          });
      } else {
        await trx('userRating').insert({
          date: Date.now(),
          mediaItemId: mediaItemId,
          seasonId: seasonId,
          episodeId: episodeId,
          userId: userId,
          rating: rating || null,
          review: review || null,
        });
      }
    });
  },

  async delete(args: { ratingId: number; userId: number }) {
    const { ratingId, userId } = args;

    await Database.knex.transaction(async (trx) => {
      const existingRating = await trx('userRating')
        .where('id', ratingId)
        .where('userId', userId)
        .first();

      if (!existingRating) {
        throw new Error(
          `there is not rating with id ${ratingId} and user ${userId}`
        );
      }

      await trx('userRating').where('id', ratingId).delete();
    });
  },
} as const;
