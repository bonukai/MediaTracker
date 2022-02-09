import { createExpressRoute } from 'typescript-routes-to-openapi-server';
import { watchlistRepository } from 'src/repository/watchlist';

/**
 * @openapi_tags Watchlist
 */
export class WatchlistController {
  /**
   * @openapi_operationId add
   */
  add = createExpressRoute<{
    method: 'put';
    path: '/api/watchlist';
    requestQuery: {
      mediaItemId: number;
    };
  }>(async (req, res) => {
    const userId = Number(req.user);
    const { mediaItemId } = req.query;

    const result = await watchlistRepository.findOne({
      userId: userId,
      mediaItemId: mediaItemId,
    });

    if (result) {
      res.sendStatus(400);
      return;
    }

    await watchlistRepository.create({
      userId: userId,
      mediaItemId: mediaItemId,
      addedAt: new Date().getTime(),
    });

    res.send();
  });

  /**
   * @openapi_operationId delete
   */
  delete = createExpressRoute<{
    method: 'delete';
    path: '/api/watchlist';
    requestQuery: {
      mediaItemId: number;
    };
  }>(async (req, res) => {
    const userId = Number(req.user);
    const { mediaItemId } = req.query;

    await watchlistRepository.delete({
      userId: userId,
      mediaItemId: mediaItemId,
    });

    res.send();
  });
}
