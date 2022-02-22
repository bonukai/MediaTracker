import express from 'express';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import path from 'path';
import chalk from 'chalk';
import { nanoid } from 'nanoid';
import { t } from '@lingui/macro';

import { runMigrations, knex } from 'src/dbconfig';
import {
  PUBLIC_PATH,
  ASSETS_PATH,
  NODE_ENV,
  DEMO,
  IGDB_CLIENT_ID,
  IGDB_CLIENT_SECRET,
  PORT,
  HOSTNAME,
  SERVER_LANG,
  TMDB_LANG,
  AUDIBLE_LANG,
  validateConfig,
} from 'src/config';
import { generatedRoutes } from 'src/generated/routes/routes';
import { metadataProviders } from 'src/metadata/metadataProviders';
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

let updateMetadataCancellationToken: CancellationToken;

GlobalConfiguration.subscribe('tmdbLang', async (value, previousValue) => {
  if (!previousValue) {
    return;
  }

  console.log(
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

const catchAndPrintError = async (fn: () => Promise<void> | void) => {
  try {
    await fn();
  } catch (error) {
    console.log(chalk.bold.red(error));
    return;
  }
};

(async () => {
  await catchAndPrintError(validateConfig);

  setupI18n(SERVER_LANG || 'en');

  const app = express();

  await runMigrations();

  const configuration = await configurationRepository.findOne();

  if (!configuration) {
    await configurationRepository.create({
      enableRegistration: true,
      serverLang: SERVER_LANG || 'en',
      tmdbLang: TMDB_LANG || 'en',
      audibleLang: AUDIBLE_LANG || 'us',
      igdbClientId: IGDB_CLIENT_ID,
      igdbClientSecret: IGDB_CLIENT_SECRET,
    });
  } else {
    await configurationRepository.update({
      serverLang: SERVER_LANG || configuration.serverLang,
      tmdbLang: TMDB_LANG || configuration.tmdbLang,
      audibleLang: AUDIBLE_LANG || configuration.audibleLang,
      igdbClientId: IGDB_CLIENT_ID || configuration.igdbClientId,
      igdbClientSecret: IGDB_CLIENT_SECRET || configuration.igdbClientSecret,
    });
  }

  if (DEMO) {
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

    console.log(chalk.green.bold(t`DEMO mode enabled`));
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

  app.use(express.static(PUBLIC_PATH));
  app.use(express.static(ASSETS_PATH));

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

  const server = app.listen(PORT, HOSTNAME, async () => {
    const address = `http://${HOSTNAME}:${PORT}`;

    console.log(t`MediaTracker listening at ${address}`);

    if (NODE_ENV === 'production') {
      await catchAndPrintError(updateMetadata);
      await catchAndPrintError(sendNotifications);

      setInterval(async () => {
        await catchAndPrintError(updateMetadata);
        await catchAndPrintError(sendNotifications);
      }, durationToMilliseconds({ hours: 1 }));
    }
  });

  server.on('close', async () => {
    await knex.destroy();
  });
})();
