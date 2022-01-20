import express from 'express';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import path from 'path';
import { nanoid } from 'nanoid';

import { runMigrations, knex } from 'src/dbconfig';
import { PUBLIC_PATH, ASSETS_PATH, NODE_ENV } from 'src/config';
import { generatedRoutes } from 'src/generated/routes/routes';
import { metadataProviders } from 'src/metadata/metadataProviders';
import { AccessTokenMiddleware } from 'src/middlewares/token';
import { SessionStore } from 'src/sessionStore';
import { requireUserAuthentication } from 'src/auth';
import { sessionKeyRepository } from 'src/repository/sessionKey';
import { configurationRepository } from 'src/repository/globalSettings';
import { sendNotifications } from 'src/sendNotifications';
import { updateMetadata } from 'src/updateMetadata';
import { durationToMilliseconds } from 'src/utils';

(async () => {
    const app = express();
    const port = Number(process.env.PORT) || 7481;
    const hostname = process.env.HOSTNAME || '127.0.0.1';

    await runMigrations();

    await metadataProviders.load();

    let sessionKey = await sessionKeyRepository.findOne();

    if (!sessionKey) {
        sessionKey = {
            key: nanoid(1024),
            createdAt: new Date().getTime(),
        };

        await sessionKeyRepository.create(sessionKey);
    }

    const configuration = await configurationRepository.findOne();

    if (!configuration) {
        await configurationRepository.create({
            enableRegistration: true,
        });
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
                res.set(
                    'Content-Type',
                    'application/javascript; charset=UTF-8'
                );
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
            ].includes(req.path)
        ) {
            next();
        } else {
            requireUserAuthentication(req, res, next);
        }
    });

    app.use(generatedRoutes);

    const server = app.listen(port, hostname, async () => {
        console.log(`MediaTracker listening at http://${hostname}:${port}`);

        if (NODE_ENV === 'production') {
            await updateMetadata();
            await sendNotifications();

            setInterval(async () => {
                await sendNotifications();
                await updateMetadata();
            }, durationToMilliseconds({ hours: 1 }));
        }
    });

    server.on('close', async () => {
        await knex.destroy();
    });
})();
