// This file was generated by typescript-routes-to-openapi

import express, { RequestHandler, Router } from 'express';
import Ajv from 'ajv';
import { ValidationError } from 'typescript-routes-to-openapi-server';

const ajv = new Ajv({
  allErrors: true,
  coerceTypes: true,
  verbose: true,
  removeAdditional: true,
});

const validatorHandler = (args: {
  pathParamsSchema?: unknown;
  requestQuerySchema?: unknown;
  requestBodySchema?: unknown;
}): RequestHandler => {
  const { pathParamsSchema, requestQuerySchema, requestBodySchema } = args;

  const pathParamsValidator = pathParamsSchema && ajv.compile(pathParamsSchema);
  const requestQueryValidator =
    requestQuerySchema && ajv.compile(requestQuerySchema);
  const requestBodySchemaValidator =
    requestBodySchema && ajv.compile(requestBodySchema);

  return (req, res, next) => {
    if (pathParamsValidator && !pathParamsValidator(req.params)) {
      next(
        new ValidationError(
          pathParamsValidator.errors,
          ajv.errorsText(pathParamsValidator.errors, {
            dataVar: 'Path params',
          })
        )
      );
    } else if (requestQueryValidator && !requestQueryValidator(req.query)) {
      next(
        new ValidationError(
          requestQueryValidator.errors,
          ajv.errorsText(requestQueryValidator.errors, {
            dataVar: 'Query string',
          })
        )
      );
    } else if (
      requestBodySchemaValidator &&
      !requestBodySchemaValidator(req.body)
    ) {
      next(
        new ValidationError(
          requestBodySchemaValidator.errors,
          ajv.errorsText(requestBodySchemaValidator.errors, {
            dataVar: 'Request body',
          })
        )
      );
    } else {
      next();
    }
  };
};

import { CalendarController } from '../../controllers/calendar';
import { ConfigurationController } from '../../controllers/configuration';
import { ImgController } from '../../controllers/img';
import { MediaItemController } from '../../controllers/item';
import { ItemsController } from '../../controllers/items';
import { LogsController } from '../../controllers/logs';
import { ProgressController } from '../../controllers/progress';
import { RatingController } from '../../controllers/rating';
import { SearchController } from '../../controllers/search';
import { SeenController } from '../../controllers/seen';
import { TokenController } from '../../controllers/token';
import { UsersController } from '../../controllers/users';
import { WatchlistController } from '../../controllers/watchlist';
import { GoodreadsImportController } from '../../controllers/import/goodreads';
import { TraktTvImportController } from '../../controllers/import/traktTv';

const _CalendarController = new CalendarController();
const _ConfigurationController = new ConfigurationController();
const _ImgController = new ImgController();
const _MediaItemController = new MediaItemController();
const _ItemsController = new ItemsController();
const _LogsController = new LogsController();
const _ProgressController = new ProgressController();
const _RatingController = new RatingController();
const _SearchController = new SearchController();
const _SeenController = new SeenController();
const _TokenController = new TokenController();
const _UsersController = new UsersController();
const _WatchlistController = new WatchlistController();
const _GoodreadsImportController = new GoodreadsImportController();
const _TraktTvImportController = new TraktTvImportController();

const router: Router = express.Router();

router.get(
  '/api/calendar',
  validatorHandler({
    requestQuerySchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        start: { type: ['string', 'null'] },
        end: { type: ['string', 'null'] },
      },
    },
  }),
  _CalendarController.get
);
router.patch(
  '/api/configuration',
  validatorHandler({
    requestBodySchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      definitions: {
        TmdbLang: {
          enum: [
            'aa',
            'ab',
            'af',
            'am',
            'ar',
            'as',
            'ay',
            'az',
            'ba',
            'be',
            'bg',
            'bh',
            'bi',
            'bn',
            'bo',
            'br',
            'ca',
            'co',
            'cs',
            'cy',
            'da',
            'de',
            'dz',
            'el',
            'en',
            'eo',
            'es',
            'et',
            'eu',
            'fa',
            'fi',
            'fj',
            'fo',
            'fr',
            'fy',
            'ga',
            'gd',
            'gl',
            'gn',
            'gu',
            'ha',
            'he',
            'hi',
            'hr',
            'hu',
            'hy',
            'ia',
            'id',
            'ie',
            'ik',
            'is',
            'it',
            'iu',
            'ja',
            'jw',
            'ka',
            'kk',
            'kl',
            'km',
            'kn',
            'ko',
            'ks',
            'ku',
            'ky',
            'la',
            'ln',
            'lo',
            'lt',
            'lv',
            'mg',
            'mi',
            'mk',
            'ml',
            'mn',
            'mo',
            'mr',
            'ms',
            'mt',
            'my',
            'na',
            'ne',
            'nl',
            'no',
            'oc',
            'om',
            'or',
            'pa',
            'pl',
            'ps',
            'pt',
            'qu',
            'rm',
            'rn',
            'ro',
            'ru',
            'rw',
            'sa',
            'sd',
            'sg',
            'sh',
            'si',
            'sk',
            'sl',
            'sm',
            'sn',
            'so',
            'sq',
            'sr',
            'ss',
            'st',
            'su',
            'sv',
            'sw',
            'ta',
            'te',
            'tg',
            'th',
            'ti',
            'tk',
            'tl',
            'tn',
            'to',
            'tr',
            'ts',
            'tt',
            'tw',
            'ug',
            'uk',
            'ur',
            'uz',
            'vi',
            'vo',
            'wo',
            'xh',
            'yi',
            'yo',
            'za',
            'zh',
            'zu',
          ],
          type: 'string',
        },
        AudibleLang: {
          enum: ['au', 'ca', 'de', 'es', 'fr', 'in', 'it', 'jp', 'uk', 'us'],
          type: 'string',
        },
        ServerLang: { enum: ['da', 'de', 'en', 'es'], type: 'string' },
      },
      type: 'object',
      properties: {
        enableRegistration: { type: ['boolean', 'null'] },
        tmdbLang: {
          oneOf: [{ $ref: '#/definitions/TmdbLang' }, { type: 'null' }],
        },
        audibleLang: {
          oneOf: [{ $ref: '#/definitions/AudibleLang' }, { type: 'null' }],
        },
        serverLang: {
          oneOf: [{ $ref: '#/definitions/ServerLang' }, { type: 'null' }],
        },
        igdbClientId: { type: ['string', 'null'] },
        igdbClientSecret: { type: ['string', 'null'] },
      },
    },
  }),
  _ConfigurationController.update
);
router.get(
  '/api/configuration',
  validatorHandler({}),
  _ConfigurationController.get
);
router.get(
  '/img/:id',
  validatorHandler({
    pathParamsSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
      nullable: false,
    },
    requestQuerySchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      definitions: { ImgSize: { enum: ['original', 'small'], type: 'string' } },
      type: 'object',
      properties: {
        size: { oneOf: [{ $ref: '#/definitions/ImgSize' }, { type: 'null' }] },
      },
    },
  }),
  _ImgController.image
);
router.get(
  '/api/details/:mediaItemId',
  validatorHandler({
    pathParamsSchema: {
      type: 'object',
      properties: { mediaItemId: { type: 'number' } },
      required: ['mediaItemId'],
      nullable: false,
    },
  }),
  _MediaItemController.details
);
router.get(
  '/api/items/paginated',
  validatorHandler({
    requestQuerySchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      definitions: {
        GetItemsRequest: {
          allOf: [
            {
              type: 'object',
              properties: {
                orderBy: {
                  oneOf: [
                    { $ref: '#/definitions/MediaItemOrderBy' },
                    { type: 'null' },
                  ],
                },
                sortOrder: {
                  oneOf: [
                    { $ref: '#/definitions/SortOrder' },
                    { type: 'null' },
                  ],
                },
                filter: { type: ['string', 'null'] },
                onlyOnWatchlist: { type: ['boolean', 'null'] },
                onlySeenItems: { type: ['boolean', 'null'] },
                onlyWithNextEpisodesToWatch: { type: ['boolean', 'null'] },
                onlyWithNextAiring: { type: ['boolean', 'null'] },
                onlyWithUserRating: { type: ['boolean', 'null'] },
                onlyWithoutUserRating: { type: ['boolean', 'null'] },
                onlyWithProgress: { type: ['boolean', 'null'] },
                page: { type: ['number', 'null'] },
              },
            },
            {
              type: 'object',
              properties: {
                mediaType: {
                  oneOf: [
                    { $ref: '#/definitions/MediaType' },
                    { type: 'null' },
                  ],
                },
              },
            },
          ],
        },
        MediaItemOrderBy: {
          enum: [
            'lastSeen',
            'mediaType',
            'nextAiring',
            'progress',
            'releaseDate',
            'status',
            'title',
            'unseenEpisodes',
          ],
          type: 'string',
        },
        SortOrder: { enum: ['asc', 'desc'], type: 'string' },
        MediaType: {
          enum: ['audiobook', 'book', 'movie', 'tv', 'video_game'],
          type: 'string',
        },
      },
      $ref: '#/definitions/GetItemsRequest',
    },
  }),
  _ItemsController.getPaginated
);
router.get(
  '/api/items',
  validatorHandler({
    requestQuerySchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      definitions: {
        MediaType: {
          enum: ['audiobook', 'book', 'movie', 'tv', 'video_game'],
          type: 'string',
        },
        MediaItemOrderBy: {
          enum: [
            'lastSeen',
            'mediaType',
            'nextAiring',
            'progress',
            'releaseDate',
            'status',
            'title',
            'unseenEpisodes',
          ],
          type: 'string',
        },
        SortOrder: { enum: ['asc', 'desc'], type: 'string' },
      },
      type: 'object',
      properties: {
        mediaType: {
          oneOf: [{ $ref: '#/definitions/MediaType' }, { type: 'null' }],
        },
        orderBy: {
          oneOf: [{ $ref: '#/definitions/MediaItemOrderBy' }, { type: 'null' }],
        },
        sortOrder: {
          oneOf: [{ $ref: '#/definitions/SortOrder' }, { type: 'null' }],
        },
        filter: { type: ['string', 'null'] },
        onlyOnWatchlist: { type: ['boolean', 'null'] },
        onlySeenItems: { type: ['boolean', 'null'] },
        onlyWithNextEpisodesToWatch: { type: ['boolean', 'null'] },
        onlyWithNextAiring: { type: ['boolean', 'null'] },
        onlyWithUserRating: { type: ['boolean', 'null'] },
        onlyWithoutUserRating: { type: ['boolean', 'null'] },
        onlyWithProgress: { type: ['boolean', 'null'] },
      },
    },
  }),
  _ItemsController.get
);
router.get('/api/logs', validatorHandler({}), _LogsController.add);
router.put(
  '/api/progress',
  validatorHandler({
    requestQuerySchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        progress: { type: ['number', 'null'] },
        mediaItemId: { type: 'number' },
        episodeId: { type: ['number', 'null'] },
        date: { type: 'number' },
        duration: { type: ['number', 'null'] },
        action: { enum: ['paused', 'playing', null], type: 'string' },
      },
      required: ['date', 'mediaItemId'],
    },
  }),
  _ProgressController.add
);
router.delete(
  '/api/progress/:progressId',
  validatorHandler({
    pathParamsSchema: {
      type: 'object',
      properties: { progressId: { type: 'number' } },
      required: ['progressId'],
      nullable: false,
    },
  }),
  _ProgressController.deleteById
);
router.put(
  '/api/rating',
  validatorHandler({
    requestBodySchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        mediaItemId: { type: 'number' },
        seasonId: { type: ['number', 'null'] },
        episodeId: { type: ['number', 'null'] },
        rating: { type: ['number', 'null'] },
        review: { type: ['string', 'null'] },
      },
      required: ['mediaItemId'],
    },
  }),
  _RatingController.add
);
router.get(
  '/api/search',
  validatorHandler({
    requestQuerySchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      definitions: {
        MediaType: {
          enum: ['audiobook', 'book', 'movie', 'tv', 'video_game'],
          type: 'string',
        },
      },
      type: 'object',
      properties: {
        q: { type: 'string' },
        mediaType: { $ref: '#/definitions/MediaType' },
      },
      required: ['mediaType', 'q'],
    },
  }),
  _SearchController.search
);
router.put(
  '/api/seen',
  validatorHandler({
    requestQuerySchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      definitions: {
        LastSeenAt: {
          enum: ['custom_date', 'now', 'release_date', 'unknown'],
          type: 'string',
        },
      },
      type: 'object',
      properties: {
        mediaItemId: { type: 'number' },
        seasonId: { type: ['number', 'null'] },
        episodeId: { type: ['number', 'null'] },
        lastSeenEpisodeId: { type: ['number', 'null'] },
        lastSeenAt: {
          oneOf: [{ $ref: '#/definitions/LastSeenAt' }, { type: 'null' }],
        },
        date: { type: ['number', 'null'] },
      },
      required: ['mediaItemId'],
    },
  }),
  _SeenController.add
);
router.delete(
  '/api/seen/:seenId',
  validatorHandler({
    pathParamsSchema: {
      type: 'object',
      properties: { seenId: { type: 'number' } },
      required: ['seenId'],
      nullable: false,
    },
  }),
  _SeenController.deleteById
);
router.delete(
  '/api/seen/',
  validatorHandler({
    requestQuerySchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        mediaItemId: { type: 'number' },
        seasonId: { type: ['number', 'null'] },
        episodeId: { type: ['number', 'null'] },
      },
      required: ['mediaItemId'],
    },
  }),
  _SeenController.removeFromSeenHistory
);
router.put(
  '/api/tokens',
  validatorHandler({
    requestQuerySchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: { description: { type: 'string' } },
      required: ['description'],
    },
  }),
  _TokenController.add
);
router.delete(
  '/api/tokens',
  validatorHandler({
    requestQuerySchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: { description: { type: 'string' } },
      required: ['description'],
    },
  }),
  _TokenController.delete
);
router.get('/api/tokens', validatorHandler({}), _TokenController.get);
router.get('/api/user', validatorHandler({}), _UsersController.get);
router.get('/api/user/logout', validatorHandler({}), _UsersController.logout);
router.post(
  '/api/user/login',
  validatorHandler({
    requestBodySchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        username: { type: 'string' },
        password: { type: 'string' },
      },
      required: ['password', 'username'],
    },
  }),
  _UsersController.login
);
router.post(
  '/api/user/register',
  validatorHandler({
    requestBodySchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        username: { type: 'string' },
        password: { type: 'string' },
        confirmPassword: { type: 'string' },
      },
      required: ['confirmPassword', 'password', 'username'],
    },
  }),
  _UsersController.register
);
router.get(
  '/api/user/notification-credentials',
  validatorHandler({}),
  _UsersController.getNotificationCredentials
);
router.put(
  '/api/user/notification-credentials',
  validatorHandler({
    requestBodySchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      definitions: {
        NotificationPlatformsResponseType: {
          oneOf: [
            {
              type: 'object',
              properties: {
                platformName: { type: 'string', enum: ['gotify'] },
                credentials: {
                  type: 'object',
                  properties: {
                    url: { type: 'string' },
                    token: { type: 'string' },
                    priority: { type: 'string' },
                  },
                  required: ['priority', 'token', 'url'],
                },
              },
              required: ['credentials', 'platformName'],
            },
            {
              type: 'object',
              properties: {
                platformName: { type: 'string', enum: ['Pushbullet'] },
                credentials: {
                  type: 'object',
                  properties: { token: { type: 'string' } },
                  required: ['token'],
                },
              },
              required: ['credentials', 'platformName'],
            },
            {
              type: 'object',
              properties: {
                platformName: { type: 'string', enum: ['Pushover'] },
                credentials: {
                  type: 'object',
                  properties: { key: { type: 'string' } },
                  required: ['key'],
                },
              },
              required: ['credentials', 'platformName'],
            },
            {
              type: 'object',
              properties: {
                platformName: { type: 'string', enum: ['Pushsafer'] },
                credentials: {
                  type: 'object',
                  properties: { key: { type: 'string' } },
                  required: ['key'],
                },
              },
              required: ['credentials', 'platformName'],
            },
            {
              type: 'object',
              properties: {
                platformName: { type: 'string', enum: ['ntfy'] },
                credentials: {
                  type: 'object',
                  properties: {
                    url: { type: 'string' },
                    priority: { type: 'string' },
                    topic: { type: 'string' },
                  },
                  required: ['priority', 'topic', 'url'],
                },
              },
              required: ['credentials', 'platformName'],
            },
          ],
        },
      },
      $ref: '#/definitions/NotificationPlatformsResponseType',
    },
  }),
  _UsersController.updateNotificationCredentials
);
router.put(
  '/api/user/settings',
  validatorHandler({
    requestBodySchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        name: { type: ['string', 'null'] },
        publicReviews: { type: ['boolean', 'null'] },
        sendNotificationWhenStatusChanges: { type: ['boolean', 'null'] },
        sendNotificationWhenReleaseDateChanges: { type: ['boolean', 'null'] },
        sendNotificationWhenNumberOfSeasonsChanges: {
          type: ['boolean', 'null'],
        },
        sendNotificationForReleases: { type: ['boolean', 'null'] },
        sendNotificationForEpisodesReleases: { type: ['boolean', 'null'] },
        notificationPlatform: {
          enum: ['Pushbullet', 'Pushover', 'Pushsafer', 'gotify', 'ntfy', null],
          type: 'string',
        },
        hideOverviewForUnseenSeasons: { type: ['boolean', 'null'] },
        hideEpisodeTitleForUnseenEpisodes: { type: ['boolean', 'null'] },
      },
    },
  }),
  _UsersController.update
);
router.put(
  '/api/user/password',
  validatorHandler({
    requestBodySchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        currentPassword: { type: 'string' },
        newPassword: { type: 'string' },
      },
      required: ['currentPassword', 'newPassword'],
    },
  }),
  _UsersController.updatePassword
);
router.get(
  '/api/user/:userId',
  validatorHandler({
    pathParamsSchema: {
      type: 'object',
      properties: { userId: { type: 'number' } },
      required: ['userId'],
      nullable: false,
    },
  }),
  _UsersController.getById
);
router.put(
  '/api/watchlist',
  validatorHandler({
    requestQuerySchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: { mediaItemId: { type: 'number' } },
      required: ['mediaItemId'],
    },
  }),
  _WatchlistController.add
);
router.delete(
  '/api/watchlist',
  validatorHandler({
    requestQuerySchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: { mediaItemId: { type: 'number' } },
      required: ['mediaItemId'],
    },
  }),
  _WatchlistController.delete
);
router.post(
  '/api/import-goodreads',
  validatorHandler({
    requestBodySchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: { url: { type: 'string' } },
      required: ['url'],
    },
  }),
  _GoodreadsImportController.import
);
router.get(
  '/api/import-trakttv/device-token',
  validatorHandler({}),
  _TraktTvImportController.traktTvGetUserCode
);
router.get(
  '/api/import-trakttv/state',
  validatorHandler({}),
  _TraktTvImportController.traktTvAuthenticated
);

export { router as generatedRoutes };
