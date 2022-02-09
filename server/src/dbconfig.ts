import knexLib from 'knex';
import { t, plural } from '@lingui/macro';

import config, { migrationsDirectory } from './knexfile';

export const runMigrations = async () => {
  const [batchNo, log] = await knex.migrate.latest({
    directory: migrationsDirectory,
  });

  if (log.length > 0) {
    const name = batchNo;
    const count = log.length;

    console.log(t`Running migrations`);

    console.log(
      t`Batch ${name} run: ${plural(count, {
        one: '# migration',
        other: '# migrations',
      })}`
    );
    console.log(log.join('\n'));
  }
};

export const knex = knexLib(config.production);
