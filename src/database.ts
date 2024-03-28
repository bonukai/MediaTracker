import * as knexPkg from 'knex';
import { resolve } from 'path';
import { z } from 'zod';

import { __dirname } from './dirname.js';
import { logger } from './logger.js';
import { h } from './utils.js';

const databaseConfigSchema = z.discriminatedUnion('client', [
  z.object({
    client: z.literal('better-sqlite3'),
    filename: z.string(),
  }),
  z.object({
    client: z.literal('pg'),
    connectionString: z.string(),
  }),
  z.object({
    client: z.literal('mysql'),
    connectionString: z.string(),
  }),
]);

export type DatabaseConfig = z.infer<typeof databaseConfigSchema>;

export class Database {
  static #knex: knexPkg.Knex;

  static get knex() {
    return Database.#knex;
  }

  static init(args: z.infer<typeof databaseConfigSchema>): void {
    const databaseConfiguration = databaseConfigSchema.parse(args);

    if (databaseConfiguration.client === 'better-sqlite3') {
      logger.info(
        h`Connecting to SQLite database at ${databaseConfiguration.filename}`
      );
    } else if (databaseConfiguration.client === 'pg') {
      logger.info(
        h`Connecting to PostgreSQL database with connection string ${'*'.repeat(
          databaseConfiguration.connectionString.length
        )}`
      );
    }

    Database.#knex = knexPkg.default.knex({
      client: databaseConfiguration.client,
      connection:
        databaseConfiguration.client === 'better-sqlite3'
          ? {
              filename: databaseConfiguration.filename,
            }
          : databaseConfiguration.connectionString,

      useNullAsDefault: true,
    });
  }

  static async runMigrations(verbose = true): Promise<void> {
    if (verbose) {
      logger.info(`Running migrations`);
    }

    const [batchNo, log] = await Database.#knex.migrate.latest({
      directory: resolve(__dirname, 'migrations'),
    });

    if (log.length > 0) {
      const name = batchNo;
      const count = log.length;

      if (verbose) {
        logger.info(
          `Batch ${name} run: ${count} ${
            count == 1 ? 'migration' : 'migrations'
          }`
        );

        log.map((value: string) => logger.info(value));
      }
    }
  }

  static async close(): Promise<void> {
    logger.info('closing database');
    await Database.#knex.destroy();
  }
}
