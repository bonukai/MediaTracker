import { Knex } from 'knex';
import path from 'path';
import {
    DATABASE_CLIENT,
    DATABASE_VERSION,
    DATABASE_URL,
    DATABASE_HOST,
    DATABASE_PORT,
    DATABASE_USER,
    DATABASE_PASSWORD,
    DATABASE_DATABASE,
    DATABASE_SSL,
    DATABASE_PATH,
} from 'src/config';

export const migrationsDirectory = path.resolve(__dirname, 'src/migrations');

const commonSettings: Knex.Config = {
    client: 'better-sqlite3',
    useNullAsDefault: true,
    migrations: {
        extension: 'ts',
    },
};

const knexConfig: Record<string, Knex.Config> = {
    development: {
        ...commonSettings,
        connection: {
            filename: './data.db',
        },
    },
    test: {
        ...commonSettings,
        connection: {
            filename: './test.db',
        },
    },
    production: DATABASE_CLIENT
        ? {
              client: DATABASE_CLIENT,
              version: DATABASE_VERSION,
              connection: {
                  connectionString: DATABASE_URL,
                  host: DATABASE_HOST,
                  port: DATABASE_PORT,
                  user: DATABASE_USER,
                  password: DATABASE_PASSWORD,
                  database: DATABASE_DATABASE,
                  ssl: DATABASE_SSL ? { rejectUnauthorized: false } : undefined,
              },
          }
        : {
              ...commonSettings,
              connection: {
                  filename: DATABASE_PATH,
              },
          },
};

export default knexConfig;
