import compression from 'compression';
import cookieParser from 'cookie-parser';
import express, { ErrorRequestHandler } from 'express';
import http from 'http';
import https from 'https';
import _ from 'lodash';
import os from 'os';
import path from 'path';

import { Database } from './database.js';
import { logger } from './logger.js';
import { multipartFormDataMiddleware } from './middleware/multipartFormDataMiddleware.js';
import { configurationRepository } from './repository/configurationRepository.js';
import { mediaItemRepository } from './repository/mediaItemRepository.js';
import { serverInternalSettingsRepository } from './repository/serverInternalSettingsRepository.js';
import {
  openApiMiddleware,
  printRestApiRoutes,
  trpcMiddleware,
} from './routes.js';
import { startUpdaterForAllMediaItems } from './scheduledMetadataUpdates.js';
import { h } from './utils.js';
import { MediaTrackerVersion } from './version.js';

import { sendAndScheduledNotificationsForReleases } from './releaseNotifications.js';
import { setupI18n } from './i18n/i18n.js';
import { scheduleLastAndUpcomingAiringsUpdate } from './lastAndUpcomingAirings.js';

export const startServer = async (args: {
  port: number;
  address?: string;
  protocol: 'http' | 'https';
  key?: Buffer;
  cert?: Buffer;
}) => {
  const { port, address, protocol, key, cert } = args;

  await Database.runMigrations();

  await configurationRepository.createIfDoesNotExists();

  const { sessionKey } = await serverInternalSettingsRepository.get();

  await Database.knex.transaction(async (trx) => {
    await mediaItemRepository.updateLastAndNextMediaItemAirings({ trx });
    await mediaItemRepository.updateLastAndUpcomingEpisodeAirings({ trx });
  });

  await scheduleLastAndUpcomingAiringsUpdate();

  setupI18n();
  printRestApiRoutes();

  logger.info(h`MediaTracker ${`v${MediaTrackerVersion}`}`);

  return new Promise<void>(async (resolve, reject) => {
    logger.info(
      h`Server timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`
    );
    logger.info(h`Server time: ${new Date().toLocaleString()}`);

    const app = express();

    app.use(express.json({ limit: '100mb' }));
    app.use(multipartFormDataMiddleware);
    app.use(cookieParser(sessionKey.key));

    app.use(compression());

    app.get(/\.(?:js|css|woff2)$/, (req, res, next) => {
      res.set('Cache-Control', 'max-age=31536000');
      next();
    });

    app.use('/api/trpc/', trpcMiddleware);
    app.use(openApiMiddleware);
    app.use(errorLoggerMiddleware);

    app.use(express.static('client/dist'));

    app.get('*', (req, res) => {
      res.sendFile(path.resolve('client/dist/index.html'));
    });

    const listen = async () => {
      return new Promise<http.Server>((resolve) => {
        if (protocol === 'http') {
          const server = app.listen(port, address || '0.0.0.0', () =>
            resolve(server)
          );
        } else {
          const server = https
            .createServer({ cert, key }, app)
            .listen(port, address || '0.0.0.0', () => resolve(server));
        }
      });
    };

    const server = await listen();

    const listenAddress = server.address();

    if (typeof listenAddress === 'string') {
      logger.info(h`MediaTracker listening on ${listenAddress}`);
    } else {
      if (listenAddress?.address === '0.0.0.0') {
        for (const add of ['localhost', ...getAllIPv4addresses()]) {
          logger.info(
            h`MediaTracker listening on ${`${protocol}://${add}:${listenAddress.port}`}`
          );
        }
      } else {
        logger.info(
          h`MediaTracker listening on ${`${protocol}://${listenAddress?.address}:${listenAddress?.port}`}`
        );
      }
    }

    server.on('close', () => {
      logger.info(`server closed`);
      reject();
    });

    const onCloseHandler = async (signal: string) => {
      logger.info(`received signal ${signal}`);
      await Database.close();
      server.close();
      resolve();
    };

    process.once('SIGHUP', onCloseHandler);
    process.once('SIGINT', onCloseHandler);
    process.once('SIGTERM', onCloseHandler);
    process.once('SIGKILL ', onCloseHandler);

    try {
      await sendAndScheduledNotificationsForReleases();
      await startUpdaterForAllMediaItems();
    } catch (error) {
      logger.error(error);
    }
  });
};

const errorLoggerMiddleware: ErrorRequestHandler = (err, req, res, next) => {
  logger.error(err);
  res.status(500).send(String(err));
};

const getAllIPv4addresses = (): string[] => {
  const nets = os.networkInterfaces();

  return Object.entries(nets)
    .flatMap(([_, value]) => (value ? Object.values(value) : []))
    .filter((item) => item.internal === false)
    .filter((item) => item.family === 'IPv4')
    .map((item) => item.address);
};
