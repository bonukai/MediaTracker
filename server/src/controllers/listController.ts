import { Database } from 'src/dbconfig';
import { List, ListPrivacy, ListSortBy, ListSortOrder } from 'src/entity/list';
import {
  ListItemsResponse,
  listRepository,
  ListDetailsResponse,
} from 'src/repository/list';
import { createExpressRoute } from 'typescript-routes-to-openapi-server';

/**
 * @openapi_tags List
 */
export class ListController {
  /**
   * @openapi_operationId Add list
   */
  add = createExpressRoute<{
    method: 'put';
    path: '/api/list';
    requestBody: {
      name: string;
      description?: string;
      privacy?: ListPrivacy;
      sortBy?: ListSortBy;
      sortOrder?: ListSortOrder;
    };
    responseBody: List;
  }>(async (req, res) => {
    const userId = Number(req.user);
    const { name, description, privacy, sortBy, sortOrder } = req.body;

    const list = await listRepository.create({
      userId: userId,
      name,
      description,
      privacy,
      sortBy,
      sortOrder,
    });

    if (list) {
      res.send(list);
    } else {
      res.sendStatus(400);
    }
  });

  /**
   * @openapi_operationId Update list
   */
  update = createExpressRoute<{
    method: 'patch';
    path: '/api/list';
    requestBody: {
      id: number;
      name: string;
      description?: string;
      privacy?: ListPrivacy;
      sortBy?: ListSortBy;
      sortOrder?: ListSortOrder;
    };
    responseBody: List;
  }>(async (req, res) => {
    const userId = Number(req.user);
    const { id, name, description, privacy, sortBy, sortOrder } = req.body;

    const list = await listRepository.update({
      userId: userId,
      id,
      name,
      description,
      privacy,
      sortBy,
      sortOrder,
    });

    if (list) {
      res.send(list);
    } else {
      res.sendStatus(400);
    }
  });

  /**
   * @openapi_operationId Get list
   */
  get = createExpressRoute<{
    method: 'get';
    path: '/api/list';
    requestQuery: {
      listId: number;
    };
    responseBody: ListDetailsResponse;
  }>(async (req, res) => {
    const currentUser = Number(req.user);
    const { listId } = req.query;

    const list = await listRepository.details({
      userId: currentUser,
      listId: listId,
    });

    if (list) {
      res.send(list);
    } else {
      res.sendStatus(400);
    }
  });

  /**
   * @openapi_operationId Delete list
   */
  delete = createExpressRoute<{
    method: 'delete';
    path: '/api/list';
    requestQuery: {
      listId: number;
    };
    responseBody: ListDetailsResponse;
  }>(async (req, res) => {
    const currentUser = Number(req.user);
    const { listId } = req.query;

    const success = await listRepository.delete({
      userId: currentUser,
      listId: listId,
    });

    if (success) {
      res.send();
    } else {
      res.sendStatus(400);
    }
  });

  /**
   * @openapi_operationId Get List Items
   */
  getListItems = createExpressRoute<{
    method: 'get';
    path: '/api/list/items';
    requestQuery: {
      listId: number;
    };
    responseBody: ListItemsResponse;
  }>(async (req, res) => {
    const currentUser = Number(req.user);
    const { listId } = req.query;

    const list = await Database.knex<List>('list').where('id', listId).first();

    if (!list) {
      res.sendStatus(404);
      return;
    }

    if (list.userId !== currentUser && list.privacy === 'private') {
      res.sendStatus(403);
      return;
    }

    const items = await listRepository.items({
      listId: list.id,
      userId: currentUser,
    });

    res.send(items);
  });
}
