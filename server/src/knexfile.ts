import { Knex } from 'knex';
import path from 'path';
import crypto from 'crypto';
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
import { ensureDirSync, existsSync, unlinkSync } from 'fs-extra';

export const migrationsDirectory = path.resolve(__dirname, 'migrations');

const isTest = Boolean(process.env.TS_JEST);

const testDatabaseName = () => {
    return crypto
        .createHash('sha256')
        .update(expect.getState().testPath)
        .digest('hex');
};

const testDatabaseFilename = () => {
    const filename = path.resolve(
        __dirname,
        '../testDatabase',
        `${testDatabaseName()}.db`
    );

    if (existsSync(filename)) {
        unlinkSync(filename);
    }

    ensureDirSync(path.dirname(filename));

    return filename;
};

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
            database: isTest ? testDatabaseName() : DATABASE_DATABASE,
            ssl: DATABASE_SSL ? { rejectUnauthorized: false } : undefined,
            filename: isTest ? testDatabaseFilename() : DATABASE_PATH,
        },
        useNullAsDefault: true,
        migrations: {
            extension: MIGRATIONS_EXTENSION,
        },
    },
};

export default knexConfig;
