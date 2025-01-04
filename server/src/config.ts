import { join, resolve } from 'path';
import { homedir } from 'os';
import { ensureDirSync, existsSync, moveSync, statSync } from 'fs-extra';
import { version } from '../package.json';

import {
  audibleLang,
  AudibleCountryCode,
  serverLang,
  ServerLang,
  tmdbLang,
  TmdbLang,
} from 'src/entity/configuration';
import { validateTmdbApiKey } from './utils';

/**
 * Logger depends on LOGS_PATH, it cannot be used here.
 */
const logs: string[] = [];
export const configMigrationLogs = () => logs;

export class Config {
  static readonly version = version;

  static readonly configDirectory = join(homedir(), '.mediatracker');

  static readonly MIGRATIONS_DIRECTORY = resolve(__dirname, 'migrations');

  static readonly NODE_ENV = process.env.NODE_ENV as
    | 'development'
    | 'production'
    | 'test';

  static readonly PUBLIC_PATH = join(__dirname, '../public');

  static readonly ASSETS_PATH =
    process.env.ASSETS_PATH || join(this.configDirectory, 'img');

  static readonly LOGS_PATH =
    process.env.LOGS_PATH || join(this.configDirectory, 'logs');

  static readonly DATABASE_PATH =
    process.env.DATABASE_PATH || join(this.configDirectory, 'data.db');

  static readonly DATABASE_CLIENT =
    process.env.DATABASE_CLIENT || 'better-sqlite3';
  static readonly DATABASE_URL = process.env.DATABASE_URL;
  static readonly DATABASE_VERSION = process.env.DATABASE_VERSION;
  static readonly DATABASE_HOST = process.env.DATABASE_HOST;
  static readonly DATABASE_PORT =
    Number(process.env.DATABASE_PORT) || undefined;

  static readonly DATABASE_USER = process.env.DATABASE_USER;
  static readonly DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;
  static readonly DATABASE_DATABASE = process.env.DATABASE_DATABASE;
  static readonly DATABASE_SSL = process.env.DATABASE_SSL
    ? Boolean(process.env.DATABASE_SSL)
    : undefined;
  static readonly MIGRATIONS_EXTENSION =
    this.NODE_ENV === 'development' || this.NODE_ENV === 'test' ? 'ts' : 'js';

  static readonly DEMO = process.env.DEMO ? Boolean(process.env.DEMO) : false;
  static readonly IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID;
  static readonly IGDB_CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET;
  static readonly TMDB_API_KEY = process.env.TMDB_API_KEY || '779734046efc1e6127485c54d3b29627';

  static readonly HOSTNAME = process.env.HOSTNAME || '127.0.0.1';
  static readonly PORT = Number(process.env.PORT) || 7481;

  static readonly SERVER_LANG =
    process.env.SERVER_LANG?.toLowerCase() as ServerLang;
  static readonly TMDB_LANG = process.env.TMDB_LANG?.toLowerCase() as TmdbLang;
  static readonly AUDIBLE_LANG =
    process.env.AUDIBLE_LANG?.toLowerCase() as AudibleCountryCode;

  static async validate() {
    if (this.SERVER_LANG && !serverLang.includes(this.SERVER_LANG)) {
      throw new Error(
        `SERVER_LANG should be one of: ${serverLang}, received: ${this.SERVER_LANG}`
      );
    }

    if (this.TMDB_LANG && !tmdbLang.includes(this.TMDB_LANG)) {
      throw new Error(
        `TMDB_LANG should be one of: ${tmdbLang}, received: ${this.TMDB_LANG}`
      );
    }

    if (this.AUDIBLE_LANG && !audibleLang.includes(this.AUDIBLE_LANG)) {
      throw new Error(
        `AUDIBLE_LANG should be one of: ${audibleLang}, received: ${this.AUDIBLE_LANG}`
      );
    }
    const isTmdbApiKeyValid: boolean = await validateTmdbApiKey(this.TMDB_API_KEY)
    if(isTmdbApiKeyValid !== true){
      throw new Error("TMDB_API_KEY is Invalid")
    }
  }

  static migrate() {
    if (!existsSync(this.configDirectory)) {
      logs.push(
        `Creating config directory at ${this.configDirectory.toString()}`
      );
      ensureDirSync(this.configDirectory);

      migratePath({
        key: 'ASSETS_PATH',
        type: 'directory',
        oldPath: resolve('img'),
        newPath: this.ASSETS_PATH,
      });

      migratePath({
        key: 'LOGS_PATH',
        type: 'directory',
        oldPath: resolve('logs'),
        newPath: this.LOGS_PATH,
      });

      migratePath({
        key: 'DATABASE_PATH',
        type: 'file',
        oldPath: resolve('data.db'),
        newPath: this.DATABASE_PATH,
      });
    }
  }
}

const migratePath = (args: {
  key: string;
  type: 'file' | 'directory';
  oldPath: string;
  newPath: string;
}) => {
  const { key, oldPath, newPath, type } = args;

  if (process.env[key]) {
    return;
  }

  if (
    !process.env.LOGS_PATH &&
    existsSync(oldPath) &&
    (type === 'file'
      ? statSync(oldPath).isFile()
      : statSync(oldPath).isDirectory()) &&
    !existsSync(newPath)
  ) {
    logs.push(`Moving ${type} from ${oldPath} to ${newPath}`);

    moveSync(oldPath, newPath);
  }

  return newPath;
};
