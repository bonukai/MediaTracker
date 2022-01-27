import knexLib from 'knex';
import { t } from 'i18next';

import config, { migrationsDirectory } from './knexfile';

export const runMigrations = async () => {
    console.log(t('Running migrations'));

    const [batchNo, log] = await knex.migrate.latest({
        directory: migrationsDirectory,
    });

    if (log.length === 0) {
        console.log(t('Already up to date'));
    } else {
        console.log(
            t('Batch {{ name }} run: {{ count }} migrations', {
                count: log.length,
                name: batchNo,
                defaultValue_one: 'Batch {{ name }} run: 1 migration',
            })
        );
        console.log(log.join('\n'));
    }
};

export const knex = knexLib(config.production);
