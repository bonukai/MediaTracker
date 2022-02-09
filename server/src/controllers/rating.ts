import { createExpressRoute } from 'typescript-routes-to-openapi-server';
import { UserRating } from 'src/entity/userRating';
import { userRatingRepository } from 'src/repository/userRating';

/**
 * @openapi_tags Rating
 */
export class RatingController {
  /**
   * @openapi_operationId add
   */
  add = createExpressRoute<{
    path: '/api/rating';
    method: 'put';
    requestBody: {
      mediaItemId: number;
      seasonId?: number;
      episodeId?: number;
      rating?: number;
      review?: string;
    };
  }>(async (req, res) => {
    const userId = Number(req.user);

    const { mediaItemId, seasonId, episodeId, rating, review } = req.body;

    const userRating: UserRating = {
      date: new Date().getTime(),
      mediaItemId: mediaItemId,
      episodeId: episodeId || null,
      seasonId: seasonId || null,
      review: review,
      userId: userId,
      rating: rating,
    };

    await userRatingRepository.updateOrCreate({
      where: {
        userId: userId,
        mediaItemId: mediaItemId,
        seasonId: seasonId || null,
        episodeId: episodeId || null,
      },
      value: userRating,
    });

    res.send();
  });
}
