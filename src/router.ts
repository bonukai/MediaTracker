import { initTRPC, TRPCError } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';

import { sessionRepository } from './repository/sessionRepository.js';
import { AccessTokenScope } from './entity/accessTokenModel.js';
import { accessTokenRepository } from './repository/accessTokenRepository.js';
import { userRepository } from './repository/userRepository.js';

export type SetCookieFunction = (args: {
  name: string;
  value: string;
  expires: Date;
}) => void;

export const createContext = ({
  req,
  res,
}: trpcExpress.CreateExpressContextOptions) => {
  const setCookie: SetCookieFunction = (args) => {
    res.cookie(args.name, args.value, {
      httpOnly: true,
      sameSite: 'strict',
      signed: true,
      expires: args.expires,
    });
  };

  const getCookie = (name: string) => {
    return req.signedCookies[name];
  };

  const removeCookie = (name: string) => {
    res.clearCookie(name);
  };

  const setHeader = (name: string, value: string) => {
    res.setHeader(name, value);
  };

  const sendFile = async (filepath: string) => {
    return new Promise<void>((resolve, reject) => {
      res.sendFile(filepath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  };

  const getQueryParams = () => {
    return req.query;
  };

  const openServerSideEventsStream = () => {
    if (req.accepts('text/event-stream')) {
      res.writeHead(200, {
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream',
      });

      return {
        write: (data: string) => {
          res.write(`${data}\n\n`);
        },
        close: () => {
          res.end();
        },
      };
    }
  };

  return {
    userId: undefined as number | undefined,
    setCookie,
    removeCookie,
    getCookie,
    setHeader,
    openServerSideEventsStream,
    getQueryParams,
    sendFile,
  };
};

export type OpenApiMeta = {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  summary?: string;
  description?: string;
  tags?: string[];
  contentType?: string;
  deprecated?: boolean;
  alternativePath?: string;
  example?: {
    request?: Record<string, unknown>;
    response?: Record<string, unknown> | string | number;
  };
};

const t = initTRPC
  .meta<{ openapi?: OpenApiMeta }>()
  .context<typeof createContext>()
  .create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

const requireAuthentication = middleware((opts) => {
  const { ctx } = opts;

  if (typeof ctx.userId !== 'number') {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return opts.next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});

const cookieAuthentication = middleware(async (opts) => {
  const { ctx } = opts;

  const cookie = ctx.getCookie('session');

  if (typeof cookie === 'string') {
    const session = await sessionRepository.findOne({ cookie });

    if (session) {
      ctx.setCookie({
        name: 'session',
        value: cookie,
        expires: new Date(session.expiresAt),
      });

      return opts.next({
        ctx: {
          ...ctx,
          userId: session.userId,
        },
      });
    }
  }

  return opts.next();
});

const scopedTokenAuthentication = (scope?: AccessTokenScope) => {
  return middleware(async (opts) => {
    const { ctx } = opts;

    const queryParams = ctx.getQueryParams();

    if (
      typeof queryParams === 'object' &&
      'token' in queryParams &&
      typeof queryParams.token === 'string'
    ) {
      const token = queryParams.token;

      const userId = await accessTokenRepository.find({
        token,
        scope,
      });

      if (typeof userId === 'number') {
        return opts.next({
          ctx: {
            ...ctx,
            userId,
          },
        });
      }
    }

    return opts.next();
  });
};

export const protectedProcedure = publicProcedure
  .use(scopedTokenAuthentication())
  .use(cookieAuthentication)
  .use(requireAuthentication);

export const adminOnlyProtectedProcedure = publicProcedure
  .use(scopedTokenAuthentication())
  .use(cookieAuthentication)
  .use(requireAuthentication)
  .use(async (opts) => {
    const { ctx } = opts;

    const user = await userRepository.get({ userId: ctx.userId });

    if (user.admin !== true) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    return opts.next(opts);
  });

export const scopedToken = (scope: AccessTokenScope) => {
  return publicProcedure
    .use(scopedTokenAuthentication(scope))
    .use(cookieAuthentication)
    .use(requireAuthentication);
};
