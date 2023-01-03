import { t } from '@lingui/macro';
import chalk from 'chalk';
import http from 'http';
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
import { AudibleLang, ServerLang, TmdbLang } from 'src/entity/configuration';

type ServerConfig = {
  publicPath: string;
  assetsPath: string;
  sessionKey: string;
  hostname: string;
  port: number;
  production: boolean;
};
export class Server {
  #app: Express;
  #server: http.Server;
  #config: ServerConfig;

  constructor(config: ServerConfig) {
    if (config.sessionKey.trim().length === 0) {
      throw new Error('sessionKey cannot be empty');
    }

    this.#config = config;
  }

  create(): Express {
    this.#app = express();

    this.#app.use(
      session({
        secret: this.#config.sessionKey,
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

    this.#app.use(httpLogMiddleware);

    this.#app.use(cookieParser());
    this.#app.use(express.json());

    this.#app.use(passport.initialize());
    this.#app.use(passport.session());

    this.#app.use(AccessTokenMiddleware.authorize);

    this.#app.get(/\.(?:js|css|woff2)$/, (req, res, next) => {
      res.set('Cache-Control', 'max-age=31536000');
      next();
    });

    this.#app.get(/\.(?:js|css)$/, (req, res, next) => {
      const extension = parse(req.path).ext;

      const setHeaders = () => {
        if (extension === '.css') {
          res.set('Content-Type', 'text/css; charset=UTF-8');
        } else {
          res.set('Content-Type', 'application/javascript; charset=UTF-8');
        }
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

    this.#app.use(express.static(this.#config.publicPath));
    this.#app.use(express.static(this.#config.assetsPath));

    this.#app.use((req, res, next) => {
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

    this.#app.use(generatedRoutes);
    this.#app.use(errorLoggerMiddleware);

    return this.#app;
  }

  async listen() {
    if (!this.#app) {
      throw new Error('Server was not create');
    }

    await new Promise<void>((resolve, reject) => {
      this.#server = this.#app.listen(
        this.#config.port,
        this.#config.hostname,
        async () => {
          try {
            const address = `http://${this.#config.hostname}:${
              this.#config.port
            }`;

            logger.info(
              t`MediaTracker ${Config.version} listening at ${address}`
            );

            this.#server.on('close', async () => {
              logger.info(t`Server closed`);
            });

            const onCloseHandler = async (signal: string) => {
              logger.info(t`Received signal ${signal}`);
              this.#server.close();

              await Database.knex.destroy();

              // eslint-disable-next-line no-process-exit
              process.exit();
            };

            process.once('SIGHUP', onCloseHandler);
            process.once('SIGINT', onCloseHandler);
            process.once('SIGTERM', onCloseHandler);
            process.once('SIGKILL ', onCloseHandler);

            resolve();

            if (this.#config.production) {
              await catchAndLogError(updateMetadata);
              await catchAndLogError(sendNotifications);

              setInterval(async () => {
                await catchAndLogError(updateMetadata);
                await catchAndLogError(sendNotifications);
              }, durationToMilliseconds({ hours: 1 }));
            }
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  async close() {
    if (this.#server)
      await new Promise<void>((resolve, reject) =>
        this.#server.close((e) => (e ? reject(e) : resolve()))
      );
  }
}

type ApplicationConfig = {
  serverLang: ServerLang;
  tmdbLang: TmdbLang;
  audibleLang: AudibleLang;
  igdbClientId?: string;
  igdbClientSecret?: string;
  demo?: boolean;
};
export class Application {
  #server: Server;
  #config: ApplicationConfig;
  #sessionKey: string;

  constructor(config: ApplicationConfig) {
    this.#config = config;
  }

  async initialize() {
    Config.migrate();
    Config.validate();
    setupI18n(this.#config.serverLang);
    logger.init();
    Database.init();
    await Database.runMigrations();

    const configuration = await configurationRepository.findOne();

    if (!configuration) {
      await configurationRepository.create({
        enableRegistration: true,
        serverLang: this.#config.serverLang,
        tmdbLang: this.#config.tmdbLang,
        audibleLang: this.#config.audibleLang,
        igdbClientId: this.#config.igdbClientId,
        igdbClientSecret: this.#config.igdbClientSecret,
      });
    } else {
      await configurationRepository.update({
        serverLang: this.#config.serverLang || configuration.serverLang,
        tmdbLang: this.#config.tmdbLang || configuration.tmdbLang,
        audibleLang: this.#config.audibleLang || configuration.audibleLang,
        igdbClientId: this.#config.igdbClientId || configuration.igdbClientId,
        igdbClientSecret:
          this.#config.igdbClientSecret || configuration.igdbClientSecret,
      });
    }

    if (this.#config.demo) {
      const demoUser = await userRepository.findOne({ name: 'demo' });

      if (!demoUser) {
        await userRepository.create({
          name: 'demo',
          password: 'demo',
          admin: false,
        });
      } else {
        await userRepository.update({
          id: demoUser.id,
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
  }
}

export const initialize = async (args: {
  serverLang: ServerLang;
  tmdbLang: TmdbLang;
  audibleLang: AudibleLang;
  igdbClientId?: string;
  igdbClientSecret?: string;
  demo?: boolean;
}) => {
  const {
    serverLang,
    tmdbLang,
    audibleLang,
    igdbClientId,
    igdbClientSecret,
    demo,
  } = args;

  Config.migrate();
  Config.validate();
  logger.init();
  Database.init();
  await Database.runMigrations();

  logger.info(
    `Server timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`
  );
  logger.info(`Server time: ${new Date().toLocaleString()}`);

  let configuration = await configurationRepository.findOne();

  if (!configuration) {
    await configurationRepository.create({
      enableRegistration: true,
      serverLang: serverLang || 'en',
      tmdbLang: tmdbLang || 'en',
      audibleLang: audibleLang || 'us',
      igdbClientId: igdbClientId,
      igdbClientSecret: igdbClientSecret,
    });
  } else {
    await configurationRepository.update({
      serverLang: serverLang || configuration.serverLang,
      tmdbLang: tmdbLang || configuration.tmdbLang,
      audibleLang: audibleLang || configuration.audibleLang,
      igdbClientId: igdbClientId || configuration.igdbClientId,
      igdbClientSecret: igdbClientSecret || configuration.igdbClientSecret,
    });
  }

  configuration = await configurationRepository.findOne();
  setupI18n(configuration.serverLang);

  if (demo) {
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

  return {
    sessionKey: sessionKey.key,
  };
};

export const createAndStartErrorServer = (args: {
  error: unknown;
  hostname: string;
  port: number;
}) => {
  const { error, hostname, port } = args;
  const server = express();

  server.all('*', (req, res) => {
    res.status(500);
    res.send(
      String.raw`
          <!DOCTYPE html>
          <html lang="en">
            <meta charset="UTF-8" />
            <title>MediaTracker</title>
            <meta
              name="viewport"
              content="width=device-width,initial-scale=1"
            />
            <style></style>
            <body>
              <div>
                <h1>500: Server error</h1>
                <p>${String(error)}</p>
              </div>
            </body>
          </html>
        `
    );
  });

  server.listen(port, hostname, () => {
    const address = `http://${hostname}:${port}`;
    console.log(`starting server at ${address}`);
  });
};

export const createAndStartServer = async () => {
  let server: Server;

  try {
    const res = await initialize({
      serverLang: Config.SERVER_LANG,
      tmdbLang: Config.TMDB_LANG,
      audibleLang: Config.AUDIBLE_LANG,
      igdbClientId: Config.IGDB_CLIENT_ID,
      igdbClientSecret: Config.IGDB_CLIENT_SECRET,
      demo: Config.DEMO,
    });
    server = new Server({
      hostname: Config.HOSTNAME,
      port: Config.PORT,
      assetsPath: Config.ASSETS_PATH,
      publicPath: Config.PUBLIC_PATH,
      sessionKey: res.sessionKey,
      production: Config.NODE_ENV === 'production',
    });

    server.create();
    await server.listen();
  } catch (error) {
    await server?.close();
    console.log(chalk.red.bold(`error: ${error}`));
    createAndStartErrorServer({
      hostname: Config.HOSTNAME,
      port: Config.PORT,
      error: error,
    });
  }
};
