import { knex } from 'src/dbconfig';
import { MIGRATIONS_EXTENSION } from 'src/config';
import { migrationsDirectory } from 'src/knexfile';
import { clearDatabase } from '../__utils__/utils';
import { Knex } from 'knex';
import { InitialData } from '__tests__/__utils__/data';

describe('migrations', () => {
    beforeAll(async () => {
        await knex.migrate.rollback(
            {
                directory: migrationsDirectory,
            },
            true
        );
        await knex.migrate.up({
            name: `20210818142342_init.${MIGRATIONS_EXTENSION}`,
            directory: migrationsDirectory,
        });

        await knex('user').insert(InitialData.user);
        await knex('configuration').insert(InitialData.configuration);
        await knex('accessToken').insert(InitialData.accessToken);
        await knex('mediaItem').insert(InitialData.mediaItem);
        await knex('season').insert(InitialData.season);
        await knex('episode').insert(InitialData.episode);
        await knex('seen').insert(InitialData.seen);
        await knex('watchlist').insert(InitialData.watchlist);
        await knex('userRating').insert(InitialData.userRating);
        await knex('userRating').insert(InitialData.userRating2);
        await knex('userRating').insert(InitialData.userRating3);
        await knex('notificationsHistory').insert(
            InitialData.notificationsHistory
        );
        await knex('notificationPlatformsCredentials').insert(
            InitialData.notificationPlatformsCredentials
        );
    });

    test('20220121025651_ratingColumnFloat', async () => {
        await knex.migrate.up({
            name: `20220121025651_ratingColumnFloat.${MIGRATIONS_EXTENSION}`,
            directory: migrationsDirectory,
        });

        await knex.migrate.down({
            directory: migrationsDirectory,
        });

        await knex.migrate.up({
            name: `20220121025651_ratingColumnFloat.${MIGRATIONS_EXTENSION}`,
            directory: migrationsDirectory,
        });
    });

    test('20220122003141_bigIntToFloat', async () => {
        await knex.migrate.up({
            name: `20220122003141_bigIntToFloat.${MIGRATIONS_EXTENSION}`,
            directory: migrationsDirectory,
        });

        await knex.migrate.down({
            directory: migrationsDirectory,
        });

        await knex.migrate.up({
            name: `20220122003141_bigIntToFloat.${MIGRATIONS_EXTENSION}`,
            directory: migrationsDirectory,
        });
    });

    afterAll(clearDatabase);
});
