import { customAlphabet } from 'nanoid';
import { knex } from 'src/dbconfig';
import { migrationsDirectory } from 'src/knexfile';

export const randomNumericId = () => Number(customAlphabet('123456789', 7)());

export const clearDatabase = async () => {
  await knex.schema
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

  await knex.destroy();
};

export const runMigrations = async () => {
  await knex.migrate.latest({ directory: migrationsDirectory });
};
