export type UserRating = {
  id?: number;
  mediaItemId: number;
  date: number;
  userId: number;
  rating?: number;
  review?: string;
  episodeId?: number;
  seasonId?: number;
};

export const userRatingColumns = <const>[
  'id',
  'date',
  'mediaItemId',
  'userId',
  'rating',
  'review',
  'episodeId',
  'seasonId',
];

export class UserRatingFilters {
  public static mediaItemUserRating = (rating: UserRating) => {
    return !rating.seasonId && !rating.episodeId;
  };

  public static seasonUserRating = (rating: UserRating) => {
    return Boolean(rating.seasonId && !rating.episodeId);
  };

  public static episodeUserRating = (rating: UserRating) => {
    return Boolean(rating.episodeId);
  };
}
