import { listItemRepository } from 'src/repository/listItemRepository';
import { createExpressRoute } from 'typescript-routes-to-openapi-server';

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
      seasonId?: number;
      episodeId?: number;
    };
  }>(async (req, res) => {
    const userId = Number(req.user);
    const { mediaItemId, seasonId, episodeId } = req.query;

    if (
      !(await listItemRepository.addItem({
        userId,
        mediaItemId,
        seasonId,
        episodeId,
        watchlist: true,
      }))
    ) {
      res.sendStatus(400);
    } else {
      res.send();
    }
  });

  /**
   * @openapi_operationId delete
   */
  delete = createExpressRoute<{
    method: 'delete';
    path: '/api/watchlist';
    requestQuery: {
      mediaItemId: number;
      seasonId?: number;
      episodeId?: number;
    };
  }>(async (req, res) => {
    const userId = Number(req.user);
    const { mediaItemId, seasonId, episodeId } = req.query;

    if (
      !(await listItemRepository.removeItem({
        userId,
        mediaItemId,
        seasonId,
        episodeId,
        watchlist: true,
      }))
    ) {
      res.sendStatus(400);
    } else {
      res.send();
    }
  });
}
