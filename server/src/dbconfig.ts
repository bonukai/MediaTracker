import knexLib from 'knex';
import { t, plural } from '@lingui/macro';

import config, { migrationsDirectory } from './knexfile';
import { logger } from 'src/logger';

export const runMigrations = async () => {
  const [batchNo, log] = await knex.migrate.latest({
    directory: migrationsDirectory,
  });

  if (log.length > 0) {
    const name = batchNo;
    const count = log.length;

    logger.info(t`Running migrations`);

    logger.info(
      t`Batch ${name} run: ${plural(count, {
        one: '# migration',
        other: '# migrations',
      })}`
    );

    log.map((value: string) => logger.info(value));
  }
};

export const knex = knexLib(config.production);
