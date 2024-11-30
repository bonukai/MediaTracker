import * as knexPkg from 'knex';
import fs from 'fs';
import { resolve, basename } from 'path';
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
      if (!fs.existsSync(databaseConfiguration.filename)) {
        fs.mkdirSync(basename(databaseConfiguration.filename), {
          recursive: true,
        });
      }

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
      // Conditionally add postProcessResponse only for PostgreSQL to deal with numerics returned as string
      ...(databaseConfiguration.client === 'pg' && {
        postProcessResponse: (result) => {
          if (Array.isArray(result)) {
            return result.map((row) => this.#convertNumericColumns(row));
          } else if (result && typeof result === 'object') {
            return this.#convertNumericColumns(result);
          }
          return result; // Return as is for other cases
        },
      }),
    });
  }

  // Helper function to safely convert numeric column values from strings back to numbers.
  // Javascript doesnt have a 64bit int or decimal, so values all convert to floats.
  // This potentially returns some incorrect numbers, but ... it should be OK for tmdbRatings.
  static #convertNumericColumns(row: Record<string, any>): Record<string, any> {
    const convertedRow = { ...row };
    for (const key in row) {
      const value = row[key];
      if (typeof value === 'string' && !Number.isNaN(Number(value))) {
        convertedRow[key] = Number(value);
      }
    }
    return convertedRow;
  }
  
  static async runMigrations(verbose = true): Promise<void> {
    if (verbose) {
      logger.info(`running migrations`);
    }

    const [batchNo, log] = await Database.#knex.migrate.latest({
      directory: resolve(__dirname, 'migrations'),
    });

    if (log.length > 0) {
      const name = batchNo;
      const count = log.length;

      if (verbose) {
        logger.info(
          `batch ${name} run: ${count} ${
            count == 1 ? 'migration' : 'migrations'
          }`
        );

        log.map((value: string) => logger.info(value));
      }
    } else {
      logger.info(`migrations are up to date`);
    }
  }

  static async close(): Promise<void> {
    logger.info('closing database');
    await Database.#knex.destroy();
  }
}
