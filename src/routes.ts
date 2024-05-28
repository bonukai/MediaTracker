import { RequestHandler } from 'express';
import _ from 'lodash';

import { ProcedureRouterRecord, TRPCError } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';

import { logger } from './logger.js';
import { plexProcedure } from './procedures/plexProcedure.js';
import {
  createContext,
  OpenApiMeta,
  publicProcedure,
  router,
} from './router.js';
import { applicationTokenRouter } from './routers/applicationTokenRouter.js';
import { authRouter } from './routers/authRouter.js';
import { calendarRouter } from './routers/calendarRouter.js';
import { configurationRouter } from './routers/configurationRouter.js';
import { exportRouter } from './routers/exportRouter.js';
import { homeSectionRouter } from './routers/homeSectionRouter.js';
import { imgRouter } from './routers/imgRouter.js';
import { importRouter } from './routers/importRouter.js';
import { justWatchProviderRouter } from './routers/justWatchProviderRouter.js';
import { listRouter } from './routers/listRouter.js';
import { logsRouter } from './routers/logsRouter.js';
import { mediaItemRouter } from './routers/mediaItemRouter.js';
import { messageRouter } from './routers/messageRouter.js';
import { progressRouter } from './routers/progressRouter.js';
import { ratingRouter } from './routers/ratingRouter.js';
import { searchRouter } from './routers/searchRouter.js';
import { seenRouter } from './routers/seenRouter.js';
import { serverVersionRouter } from './routers/serverVersionRouter.js';
import { userRouter } from './routers/userRouter.js';
import { watchlistRouter } from './routers/watchlistRouter.js';
import { h } from './utils.js';

const appRouter = router({
  applicationToken: applicationTokenRouter,
  auth: authRouter,
  calendar: calendarRouter,
  configuration: configurationRouter,
  export: exportRouter,
  homeSection: homeSectionRouter,
  img: imgRouter,
  import: importRouter,
  justWatchProvider: justWatchProviderRouter,
  list: listRouter,
  logs: logsRouter,
  mediaItem: mediaItemRouter,
  message: messageRouter,
  rating: ratingRouter,
  search: searchRouter,
  seen: seenRouter,
  serverVersion: serverVersionRouter,
  progress: progressRouter,
  tautulli: publicProcedure
    .meta({
      openapi: { method: 'POST', contentType: '' },
    })
    .query(async () => {}),
  plex: plexProcedure,
  user: userRouter,
  watchlist: watchlistRouter,
});

export type MediaTrackerRouter = typeof appRouter;

export const trpcMiddleware = trpcExpress.createExpressMiddleware({
  router: appRouter,
  createContext,
  onError(opts) {
    const { error, type, path, input, ctx, req } = opts;

    if (error.code === 'INTERNAL_SERVER_ERROR') {
      logger.error(error);
    } else {
      logger.error(`${path}, ${type}, ${error.message}`);
    }
  },
});

type RestApiRoute = {
  path: string;
  callPath: string;
  openApi: OpenApiMeta;
  restApiPath: string;
};

const getRestRoutes = (
  routerRecord: ProcedureRouterRecord,
  path: string[]
): RestApiRoute[] => {
  return Object.entries(routerRecord)
    .flatMap(([currentPath, value]) => {
      const fullPath = [...path, currentPath];

      if (value._def.router) {
        return getRestRoutes(value._def.record, fullPath);
      } else if (value._def.query && value._def.meta?.openapi) {
        return {
          path: fullPath.join('/'),
          callPath: fullPath.join('.'),
          openApi: value._def.meta?.openapi,
          restApiPath: `/api/v1/${fullPath
            .map((p) =>
              p
                .split('')
                .map((letter, index) =>
                  letter.toUpperCase() === letter && index > 0
                    ? `-${letter}`
                    : letter
                )
                .join('')
                .toLowerCase()
            )
            .join('/')}`,
        };
      } else if (value._def.mutation) {
      } else if (value._def.subscription) {
      } else {
      }
    })
    .filter((item): item is RestApiRoute => item !== undefined);
};

const restRoutesMap = getRestRoutes(appRouter._def.record, []).reduce(
  (res, current) => {
    res.set(current.restApiPath, current);

    if (current.openApi.alternativePath) {
      res.set(current.openApi.alternativePath, {
        ...current,
        restApiPath: current.openApi.alternativePath,
      });
    }
    return res;
  },
  new Map<string, RestApiRoute>()
);

export const printRestApiRoutes = () => {
  restRoutesMap.forEach((route) =>
    logger.debug(
      h`REST API route: ${route.openApi.method} ${route.restApiPath}`
    )
  );
};

export const openApiMiddleware: RequestHandler = async (req, res, next) => {
  try {
    const caller = appRouter.createCaller(createContext({ req, res }));
    const matchingRoute = restRoutesMap.get(req.path);

    if (matchingRoute) {
      const query = _.get(caller, matchingRoute.callPath);

      if (!query) {
        throw new Error(`missing query function for path ${req.path}`);
      }

      const data =
        matchingRoute.openApi.method === 'GET'
          ? req.query
          : {
              ..._.omit(req.query || {}, ['token']),
              ...(req.body || {}),
            };

      const queryRes = await query(data);

      if (!res.headersSent) {
        if (matchingRoute.openApi.contentType) {
          res.setHeader('Content-Type', matchingRoute.openApi.contentType);
        }

        if (typeof queryRes === 'string') {
          res.send(queryRes);
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.send(JSON.stringify(queryRes, null, 2));
        }
      }
    } else {
      next();
    }
  } catch (error) {
    if (error instanceof TRPCError) {
      res.sendStatus(trpcErrorCodeToStatusCode(error));
    } else {
      next(error);
    }
  }
};

const trpcErrorCodeToStatusCode = (error: TRPCError) => {
  switch (error.code) {
    case 'PARSE_ERROR':
      return 400;
    case 'BAD_REQUEST':
      return 400;
    case 'UNAUTHORIZED':
      return 401;
    case 'NOT_FOUND':
      return 404;
    case 'FORBIDDEN':
      return 403;
    case 'METHOD_NOT_SUPPORTED':
      return 405;
    case 'TIMEOUT':
      return 408;
    case 'CONFLICT':
      return 409;
    case 'PRECONDITION_FAILED':
      return 412;
    case 'PAYLOAD_TOO_LARGE':
      return 413;
    case 'UNPROCESSABLE_CONTENT':
      return 422;
    case 'TOO_MANY_REQUESTS':
      return 429;
    case 'CLIENT_CLOSED_REQUEST':
      return 499;
    case 'INTERNAL_SERVER_ERROR':
      return 500;
    case 'NOT_IMPLEMENTED':
      return 501;
  }
};
