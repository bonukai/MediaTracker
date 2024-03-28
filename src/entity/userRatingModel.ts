import { z } from 'zod';

export const userRatingModelSchema = z.object({
  id: z.number(),
  mediaItemId: z.number(),
  date: z.number().nullable(),
  userId: z.number(),
  rating: z.number().nullable(),
  review: z.string().nullable(),
  episodeId: z.number().nullable(),
  seasonId: z.number().nullable(),
});

export type UserRatingModel = z.infer<typeof userRatingModelSchema>;

export class UserRatingFilters {
  public static mediaItemUserRating = (rating: UserRatingModel) => {
    return !rating.seasonId && !rating.episodeId;
  };

  public static seasonUserRating = (rating: UserRatingModel) => {
    return Boolean(rating.seasonId && !rating.episodeId);
  };

  public static episodeUserRating = (rating: UserRatingModel) => {
    return Boolean(rating.episodeId);
  };
}
