import { listItemRepository } from 'src/repository/listItemRepository';
import { createExpressRoute } from 'typescript-routes-to-openapi-server';

/**
 * @openapi_tags List Item
 */
export class ListItemController {
  /**
   * @openapi_operationId Add
   */
  addItem = createExpressRoute<{
    method: 'put';
    path: '/api/list-item';
    requestQuery: {
      listId: number;
      mediaItemId: number;
      seasonId?: number;
      episodeId?: number;
    };
  }>(async (req, res) => {
    const currentUser = Number(req.user);
    const { listId, mediaItemId, seasonId, episodeId } = req.query;

    if (
      !(await listItemRepository.addItem({
        userId: currentUser,
        listId,
        mediaItemId,
        seasonId,
        episodeId,
      }))
    ) {
      res.sendStatus(400);
    } else {
      res.send();
    }
  });

  /**
   * @openapi_operationId Remove item from list
   */
  removeItem = createExpressRoute<{
    method: 'delete';
    path: '/api/list-item';
    requestQuery: {
      listId: number;
      mediaItemId: number;
      seasonId?: number;
      episodeId?: number;
    };
  }>(async (req, res) => {
    const currentUser = Number(req.user);
    const { listId, mediaItemId, seasonId, episodeId } = req.query;

    if (
      !(await listItemRepository.removeItem({
        userId: currentUser,
        listId,
        mediaItemId,
        seasonId,
        episodeId,
      }))
    ) {
      res.sendStatus(400);
    } else {
      res.send();
    }
  });
}
