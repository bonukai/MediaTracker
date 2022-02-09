import { milliseconds } from 'date-fns';

import { knex } from 'src/dbconfig';
import { MIGRATIONS_EXTENSION } from 'src/config';
import { migrationsDirectory } from 'src/knexfile';
import { clearDatabase, randomNumericId } from '../__utils__/utils';
import { InitialData } from '__tests__/__utils__/data';
import { Image } from 'src/entity/image';
import { Configuration } from 'src/entity/configuration';
import { MediaItemBase } from 'src/entity/mediaItem';
import { Watchlist } from 'src/entity/watchlist';
import { Seen } from 'src/entity/seen';

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

    test('20220127224112_configuration', async () => {
        await knex.migrate.up({
            name: `20220127224112_configuration.${MIGRATIONS_EXTENSION}`,
            directory: migrationsDirectory,
        });

        await knex<Configuration>('configuration').update({
            audibleLang: 'US',
            serverLang: 'en',
            tmdbLang: 'en',
        });

        await knex.migrate.down({
            directory: migrationsDirectory,
        });

        await knex.migrate.up({
            name: `20220127224112_configuration.${MIGRATIONS_EXTENSION}`,
            directory: migrationsDirectory,
        });
    });

    test('20220202231058_image', async () => {
        await knex.migrate.up({
            name: `20220202231058_image.${MIGRATIONS_EXTENSION}`,
            directory: migrationsDirectory,
        });

        await knex<Image>('image').insert({
            id: '1',
            mediaItemId: InitialData.mediaItem.id,
            type: 'poster',
        });

        await knex<Image>('image').insert({
            id: '2',
            mediaItemId: InitialData.season.tvShowId,
            seasonId: InitialData.season.id,
            type: 'backdrop',
        });

        await knex.migrate.down({
            directory: migrationsDirectory,
        });

        await knex.migrate.up({
            name: `20220202231058_image.${MIGRATIONS_EXTENSION}`,
            directory: migrationsDirectory,
        });
    });

    test('20220208203349_traktId_goodreadsId', async () => {
        await knex.migrate.up({
            name: `20220208203349_traktId_goodreadsId.${MIGRATIONS_EXTENSION}`,
            directory: migrationsDirectory,
        });

        await knex<MediaItemBase>('mediaItem').insert({
            id: 999,
            title: 'title',
            source: 'user',
            traktId: 123456,
            goodreadsId: 987654,
        });

        await knex.migrate.down({
            directory: migrationsDirectory,
        });

        await knex.migrate.up({
            name: `20220208203349_traktId_goodreadsId.${MIGRATIONS_EXTENSION}`,
            directory: migrationsDirectory,
        });
    });

    test('20220208230635_numberOfPages', async () => {
        await knex.migrate.up({
            name: `20220208230635_numberOfPages.${MIGRATIONS_EXTENSION}`,
            directory: migrationsDirectory,
        });

        await knex<MediaItemBase>('mediaItem').insert({
            id: 777,
            title: 'title',
            source: 'user',
            numberOfPages: 111,
        });

        await knex.migrate.down({
            directory: migrationsDirectory,
        });

        await knex.migrate.up({
            name: `20220208230635_numberOfPages.${MIGRATIONS_EXTENSION}`,
            directory: migrationsDirectory,
        });
    });

    test('20220208234441_watchlist', async () => {
        await knex.migrate.up({
            name: `20220208234441_watchlist.${MIGRATIONS_EXTENSION}`,
            directory: migrationsDirectory,
        });

        const watchlist: Watchlist = {
            id: 777,
            userId: 1,
            mediaItemId: 1,
            addedAt: new Date().getTime(),
        };

        await knex<Watchlist>('watchlist').insert(watchlist);
        expect(
            await knex('watchlist').where('id', watchlist.id).first()
        ).toEqual(watchlist);

        await knex.migrate.down({
            directory: migrationsDirectory,
        });

        await knex.migrate.up({
            name: `20220208234441_watchlist.${MIGRATIONS_EXTENSION}`,
            directory: migrationsDirectory,
        });
    });

    test('20220209000937_seen', async () => {
        const mediaItem = {
            id: randomNumericId(),
            title: 'title',
            source: 'user',
            runtime: 121,
        };

        const show = {
            id: randomNumericId(),
            title: 'title',
            source: 'user',
            runtime: 42,
        };

        const season = {
            id: randomNumericId(),
            title: 'Season 1',
            isSpecialSeason: false,
            seasonNumber: 1,
            tvShowId: show.id,
            numberOfEpisodes: 1,
        };

        const episodeWithRuntime = {
            id: randomNumericId(),
            title: 'Episode 1',
            seasonNumber: 1,
            episodeNumber: 1,
            isSpecialEpisode: false,
            runtime: 31,
            tvShowId: show.id,
            seasonId: season.id,
            seasonAndEpisodeNumber: 1001,
        };

        const episodeWithoutRuntime = {
            id: randomNumericId(),
            title: 'Episode 2',
            seasonNumber: 1,
            episodeNumber: 2,
            isSpecialEpisode: false,
            tvShowId: show.id,
            seasonId: season.id,
            seasonAndEpisodeNumber: 1002,
        };

        const seenMediaItem = {
            id: randomNumericId(),
            userId: 1,
            mediaItemId: mediaItem.id,
        };

        const seenEpisodeWithRuntime = {
            id: randomNumericId(),
            userId: 1,
            mediaItemId: show.id,
            episodeId: episodeWithRuntime.id,
        };

        const seenEpisodeWithoutRuntime = {
            id: randomNumericId(),
            userId: 1,
            mediaItemId: show.id,
            episodeId: episodeWithoutRuntime.id,
        };

        await knex('mediaItem').insert(mediaItem);
        await knex('mediaItem').insert(show);
        await knex('season').insert(season);
        await knex('episode').insert(episodeWithRuntime);
        await knex('episode').insert(episodeWithoutRuntime);
        await knex('seen').insert(seenMediaItem);
        await knex('seen').insert(seenEpisodeWithRuntime);
        await knex('seen').insert(seenEpisodeWithoutRuntime);

        await knex.migrate.up({
            name: `20220209000937_seen.${MIGRATIONS_EXTENSION}`,
            directory: migrationsDirectory,
        });

        expect(
            (
                await knex<Seen>('seen')
                    .where('id', seenEpisodeWithRuntime.id)
                    .first()
            ).duration
        ).toEqual(episodeWithRuntime.runtime * 60 * 1000);

        expect(
            (
                await knex<Seen>('seen')
                    .where('id', seenEpisodeWithoutRuntime.id)
                    .first()
            ).duration
        ).toEqual(show.runtime * 60 * 1000);

        expect(
            (await knex<Seen>('seen').where('id', seenMediaItem.id).first())
                .duration
        ).toEqual(mediaItem.runtime * 60 * 1000);

        await knex<Seen>('seen').insert({
            id: randomNumericId(),
            userId: 1,
            mediaItemId: 1,
            startedAt: new Date().getTime(),
            duration: milliseconds({
                hours: 1,
                minutes: 10,
                seconds: 12,
            }),
            action: 'watched',
            date: new Date().getTime(),
            progress: 0.2,
        });

        await knex.migrate.down({
            directory: migrationsDirectory,
        });

        await knex.migrate.up({
            name: `20220209000937_seen.${MIGRATIONS_EXTENSION}`,
            directory: migrationsDirectory,
        });
    });

    afterAll(clearDatabase);
});
