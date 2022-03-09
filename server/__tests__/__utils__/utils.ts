import knexLib, { Knex } from 'knex';

import { customAlphabet } from 'nanoid';
import { Database } from 'src/dbconfig';

export const randomNumericId = () => Number(customAlphabet('123456789', 7)());

export const clearDatabase = async () => {
  await Database.knex.schema
    .dropTableIfExists('listItem')
    .dropTableIfExists('list')
    .dropTableIfExists('image')
    .dropTableIfExists('sessionKey')
    .dropTableIfExists('configuration')
    .dropTableIfExists('notificationPlatformsCredentials')
    .dropTableIfExists('notificationsHistory')
    .dropTableIfExists('metadataProviderCredentials')
    .dropTableIfExists('accessToken')
    .dropTableIfExists('session')
    .dropTableIfExists('userRating')
    .dropTableIfExists('watchlist')
    .dropTableIfExists('seen')
    .dropTableIfExists('user')
    .dropTableIfExists('episode')
    .dropTableIfExists('season')
    .dropTableIfExists('mediaItem')
    .dropTableIfExists('knex_migrations');

  await Database.knex.destroy();
};

export const runMigrations = async () => {
  Database.init();
  await Database.runMigrations(false);
};
