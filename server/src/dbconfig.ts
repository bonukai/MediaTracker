import knexLib, { Knex } from 'knex';
import { t, plural } from '@lingui/macro';

// import config, { migrationsDirectory } from './knexfile';

import path from 'path';
import { Config } from 'src/config';

export const migrationsDirectory = path.resolve(__dirname, 'migrations');

import { logger } from 'src/logger';

export class Database {
  static _knex: Knex;

  static init() {
    this._knex = knexLib({
      client: Config.DATABASE_CLIENT,
      version: Config.DATABASE_VERSION,
      connection: {
        connectionString: Config.DATABASE_URL,
        host: Config.DATABASE_HOST,
        port: Config.DATABASE_PORT,
        user: Config.DATABASE_USER,
        password: Config.DATABASE_PASSWORD,
        database: Config.DATABASE_DATABASE,
        ssl: Config.DATABASE_SSL ? { rejectUnauthorized: false } : undefined,
        filename: Config.DATABASE_PATH,
      },
      useNullAsDefault: true,
      migrations: {
        extension: Config.MIGRATIONS_EXTENSION,
      },
    });
  }

  static async runMigrations(verbose = true) {
    const [batchNo, log] = await Database.knex.migrate.latest({
      directory: migrationsDirectory,
    });

    if (log.length > 0) {
      const name = batchNo;
      const count = log.length;

      if (verbose) {
        logger.info(t`Running migrations`);

        logger.info(
          t`Batch ${name} run: ${plural(count, {
            one: '# migration',
            other: '# migrations',
          })}`
        );

        log.map((value: string) => logger.info(value));
      }
    }
  }

  static get knex() {
    return this._knex;
  }
}
