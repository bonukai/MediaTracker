import {
  audibleLang,
  AudibleLang,
  serverLang,
  ServerLang,
  tmdbLang,
  TmdbLang,
} from 'src/entity/configuration';

export const NODE_ENV = process.env['NODE_ENV'] as
  | 'development'
  | 'production'
  | 'test';
export const ASSETS_PATH = process.env['ASSETS_PATH'] || 'img';
export const PUBLIC_PATH = 'public';
export const LOGS_PATH = process.env['LOGS_PATH'] || 'logs';

export const DATABASE_PATH = process.env.DATABASE_PATH || './data.db';
export const DATABASE_CLIENT = process.env.DATABASE_CLIENT || 'better-sqlite3';
export const DATABASE_URL = process.env.DATABASE_URL;
export const DATABASE_VERSION = process.env.DATABASE_VERSION;
export const DATABASE_HOST = process.env.DATABASE_HOST;
export const DATABASE_PORT = process.env.DATABASE_PORT
  ? Number(process.env.DATABASE_PORT)
  : undefined;
export const DATABASE_USER = process.env.DATABASE_USER;
export const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;
export const DATABASE_DATABASE = process.env.DATABASE_DATABASE;
export const DATABASE_SSL = process.env.DATABASE_SSL
  ? Boolean(process.env.DATABASE_SSL)
  : undefined;
export const MIGRATIONS_EXTENSION =
  NODE_ENV === 'development' || NODE_ENV === 'test' ? 'ts' : 'js';

export const DEMO = process.env['DEMO'] ? Boolean(process.env['DEMO']) : false;
export const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID;
export const IGDB_CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET;

export const HOSTNAME = process.env.HOSTNAME || '127.0.0.1';
export const PORT = Number(process.env.PORT) || 7481;

export const SERVER_LANG = process.env.SERVER_LANG?.toLowerCase() as ServerLang;
export const TMDB_LANG = process.env.TMDB_LANG?.toLowerCase() as TmdbLang;
export const AUDIBLE_LANG =
  process.env.AUDIBLE_LANG?.toLowerCase() as AudibleLang;

export const validateConfig = () => {
  if (SERVER_LANG && !serverLang.includes(SERVER_LANG)) {
    throw new Error(`SERVER_LANG should be one of: ${serverLang}`);
  }

  if (TMDB_LANG && !tmdbLang.includes(TMDB_LANG)) {
    throw new Error(`TMDB_LANG should be one of: ${tmdbLang}`);
  }

  if (AUDIBLE_LANG && !audibleLang.includes(AUDIBLE_LANG)) {
    throw new Error(`AUDIBLE_LANG should be one of: ${audibleLang}`);
  }
};
