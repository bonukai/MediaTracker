#!/usr/bin/env node
/* eslint-disable node/shebang */

import 'source-map-support/register';
import express from 'express';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import path from 'path';
import chalk from 'chalk';
import { nanoid } from 'nanoid';
import { t } from '@lingui/macro';

import { Config } from 'src/config';
import { Database } from 'src/dbconfig';
import { generatedRoutes } from 'src/generated/routes/routes';
import { AccessTokenMiddleware } from 'src/middlewares/token';
import { SessionStore } from 'src/sessionStore';
import { requireUserAuthentication } from 'src/auth';
import { sessionKeyRepository } from 'src/repository/sessionKey';
import {
  configurationRepository,
  GlobalConfiguration,
} from 'src/repository/globalSettings';
import { sendNotifications } from 'src/sendNotifications';
import { updateMediaItems, updateMetadata } from 'src/updateMetadata';
import { durationToMilliseconds } from 'src/utils';
import { userRepository } from 'src/repository/user';
import { setupI18n } from 'src/i18n/i18n';
import { mediaItemRepository } from 'src/repository/mediaItem';
import { CancellationToken } from 'src/cancellationToken';
import { logger } from 'src/logger';
import { httpLogMiddleware } from 'src/middlewares/httpLogMiddleware';
import { errorLoggerMiddleware } from 'src/middlewares/errorLoggerMiddleware';

let updateMetadataCancellationToken: CancellationToken;

GlobalConfiguration.subscribe('tmdbLang', async (value, previousValue) => {
  if (!previousValue) {
    return;
  }

  logger.info(
    chalk.bold.green(
      t`TMDB language changed to: "${value}", updating metadata for all items`
    )
  );

  if (updateMetadataCancellationToken) {
    await updateMetadataCancellationToken.cancel();
  }

  updateMetadataCancellationToken = new CancellationToken();

  const mediaItems = await mediaItemRepository.find({
    source: 'tmdb',
  });

  await updateMediaItems({
    mediaItems: mediaItems,
    cancellationToken: updateMetadataCancellationToken,
    forceUpdate: true,
  });
});

const catchAndLogError = async (fn: () => Promise<void> | void) => {
  try {
    await fn();
  } catch (error) {
    console.log(error);
    logger.error(error);
    return;
  }
};

(async () => {
  await catchAndLogError(async () => {
    Config.migrate();
    Config.validate();
    setupI18n(Config.SERVER_LANG || 'en');
    logger.init();
    Database.init();
    await Database.runMigrations();
  });

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
    const extension = path.parse(req.path).ext;

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

  const server = app.listen(Config.PORT, Config.HOSTNAME, async () => {
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

  server.on('close', async () => {
    logger.info(t`Server closed`);
  });

  const onCloseHandler = async (signal: string) => {
    logger.info(t`Received signal ${signal}`);
    server.close();

    await Database.knex.destroy();

    // eslint-disable-next-line no-process-exit
    process.exit();
  };

  process.once('SIGHUP', onCloseHandler);
  process.once('SIGINT', onCloseHandler);
  process.once('SIGTERM', onCloseHandler);
  process.once('SIGKILL ', onCloseHandler);
})();
