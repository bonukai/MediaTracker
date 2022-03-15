import { t } from '@lingui/macro';
import chalk from 'chalk';
import { parse } from 'path';
import cookieParser from 'cookie-parser';
import express, { Express } from 'express';
import session from 'express-session';
import { nanoid } from 'nanoid';
import passport from 'passport';

import { Config } from 'src/config';
import { logger } from 'src/logger';
import { httpLogMiddleware } from 'src/middlewares/httpLogMiddleware';
import { AccessTokenMiddleware } from 'src/middlewares/token';
import { configurationRepository } from 'src/repository/globalSettings';
import { sessionKeyRepository } from 'src/repository/sessionKey';
import { userRepository } from 'src/repository/user';
import { SessionStore } from 'src/sessionStore';
import { requireUserAuthentication } from 'src/auth';
import { generatedRoutes } from 'src/generated/routes/routes';
import { errorLoggerMiddleware } from 'src/middlewares/errorLoggerMiddleware';
import { setupI18n } from 'src/i18n/i18n';
import { Database } from 'src/dbconfig';
import { catchAndLogError, durationToMilliseconds } from 'src/utils';
import { updateMetadata } from 'src/updateMetadata';
import { sendNotifications } from 'src/sendNotifications';

const initialize = async () => {
  Config.migrate();
  Config.validate();
  setupI18n(Config.SERVER_LANG || 'en');
  logger.init();
  Database.init();
  await Database.runMigrations();
  throw new Error('some random error');
};

export const createServer = async (): Promise<Express> => {
  await initialize();

  const app = express();

  const configuration = await configurationRepository.findOne();

  if (!configuration) {
    await configurationRepository.create({
      enableRegistration: true,
      serverLang: Config.SERVER_LANG || 'en',
      tmdbLang: Config.TMDB_LANG || 'en',
      audibleLang: Config.AUDIBLE_LANG || 'us',
      igdbClientId: Config.IGDB_CLIENT_ID,
      igdbClientSecret: Config.IGDB_CLIENT_SECRET,
    });
  } else {
    await configurationRepository.update({
      serverLang: Config.SERVER_LANG || configuration.serverLang,
      tmdbLang: Config.TMDB_LANG || configuration.tmdbLang,
      audibleLang: Config.AUDIBLE_LANG || configuration.audibleLang,
      igdbClientId: Config.IGDB_CLIENT_ID || configuration.igdbClientId,
      igdbClientSecret:
        Config.IGDB_CLIENT_SECRET || configuration.igdbClientSecret,
    });
  }

  if (Config.DEMO) {
    const demoUser = await userRepository.findOne({ name: 'demo' });

    if (!demoUser) {
      await userRepository.create({
        name: 'demo',
        password: 'demo',
        admin: false,
      });
    }

    await configurationRepository.update({
      enableRegistration: false,
    });

    logger.info(chalk.green.bold(t`DEMO mode enabled`));
  }

  let sessionKey = await sessionKeyRepository.findOne();

  if (!sessionKey) {
    sessionKey = {
      key: nanoid(1024),
      createdAt: new Date().getTime(),
    };

    await sessionKeyRepository.create(sessionKey);
  }

  app.use(
    session({
      secret: sessionKey.key,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: true,
        maxAge: 1000 * 60 * 60 * 24 * 365,
      },
      store: new SessionStore(),
    })
  );

  app.use(httpLogMiddleware);

  app.use(cookieParser());
  app.use(express.json());

  app.use(passport.initialize());
  app.use(passport.session());

  app.use(AccessTokenMiddleware.authorize);

  app.get(/\.(?:js|css)$/, (req, res, next) => {
    const extension = parse(req.path).ext;

    const setHeaders = () => {
      if (extension === '.css') {
        res.set('Content-Type', 'text/css; charset=UTF-8');
      } else {
        res.set('Content-Type', 'application/javascript; charset=UTF-8');
      }

      res.set('Cache-Control', 'max-age=31536000');
    };

    if (req.header('Accept-Encoding').includes('br')) {
      req.url = req.url + '.br';
      res.set('Content-Encoding', 'br');
      setHeaders();
    } else if (req.header('Accept-Encoding').includes('gz')) {
      req.url = req.url + '.gz';
      res.set('Content-Encoding', 'gzip');
      setHeaders();
    }

    next();
  });

  app.use(express.static(Config.PUBLIC_PATH));
  app.use(express.static(Config.ASSETS_PATH));

  app.use((req, res, next) => {
    if (
      [
        '/api/user',
        '/api/user/login',
        '/api/user/register',
        '/api/configuration',
        '/oauth/device/code',
        '/oauth/device/token',
      ].includes(req.path)
    ) {
      next();
    } else {
      requireUserAuthentication(req, res, next);
    }
  });

  app.use(generatedRoutes);
  app.use(errorLoggerMiddleware);

  return app;
};

export const startServer = async (server: Express) => {
  const connection = server.listen(Config.PORT, Config.HOSTNAME, async () => {
    const address = `http://${Config.HOSTNAME}:${Config.PORT}`;

    logger.info(t`MediaTracker listening at ${address}`);

    if (Config.NODE_ENV === 'production') {
      await catchAndLogError(updateMetadata);
      await catchAndLogError(sendNotifications);

      setInterval(async () => {
        await catchAndLogError(updateMetadata);
        await catchAndLogError(sendNotifications);
      }, durationToMilliseconds({ hours: 1 }));
    }
  });

  connection.on('close', async () => {
    logger.info(t`Server closed`);
  });

  const onCloseHandler = async (signal: string) => {
    logger.info(t`Received signal ${signal}`);
    connection.close();

    await Database.knex.destroy();

    // eslint-disable-next-line no-process-exit
    process.exit();
  };

  process.once('SIGHUP', onCloseHandler);
  process.once('SIGINT', onCloseHandler);
  process.once('SIGTERM', onCloseHandler);
  process.once('SIGKILL ', onCloseHandler);
};
