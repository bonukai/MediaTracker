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
    MIGRATIONS_EXTENSION,
} from 'src/config';

export const migrationsDirectory = path.resolve(__dirname, 'migrations');

const knexConfig: Record<string, Knex.Config> = {
    production: {
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
            filename: DATABASE_PATH,
        },
        useNullAsDefault: true,
        migrations: {
            extension: MIGRATIONS_EXTENSION,
        },
    },
};

export default knexConfig;
