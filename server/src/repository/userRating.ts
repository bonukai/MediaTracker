import { UserRating } from 'src/entity/userRating';
import { repository } from 'src/repository/repository';

export const userRatingRepository = new (repository<UserRating>({
  tableName: 'userRating',
  primaryColumnName: 'id',
  uniqueBy: (value) => ({
    mediaItemId: value.mediaItemId,
    episodeId: value.episodeId || null,
    seasonId: value.seasonId || null,
    userId: value.userId,
  }),
}))();
