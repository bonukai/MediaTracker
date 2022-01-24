import knexLib from 'knex';
import config, { migrationsDirectory } from './knexfile';

export const runMigrations = async () => {
    console.log('Running migrations');

    const [batchNo, log] = await knex.migrate.latest({
        directory: migrationsDirectory,
    });

    if (log.length === 0) {
        console.log('Already up to date');
    } else {
        console.log(`Batch ${batchNo} run: ${log.length} migrations`);
        console.log(log.join('\n'));
    }
};

const knexConfig =
    process.env.NODE_ENV === 'test'
        ? config.test
        : process.env.NODE_ENV === 'development'
        ? config.development
        : config.production;

export const knex = knexLib(knexConfig);
