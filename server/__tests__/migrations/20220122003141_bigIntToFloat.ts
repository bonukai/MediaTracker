import { TvSeason } from '../../src/entity/tvseason';
import { TvEpisode } from '../../src/entity/tvepisode';
import { UserRating } from '../../src/entity/userRating';
import { AccessToken } from '../../src/entity/accessToken';
import { Seen } from '../../src/entity/seen';
import { NotificationsHistory } from '../../src/entity/notificationsHistory';
import { NotificationPlatformsCredentials } from '../../src/entity/notificationPlatformsCredentials';
import { User } from '../../src/entity/user';
import { Watchlist } from '../../src/entity/watchlist';
import { MediaItemBase } from '../../src/entity/mediaItem';
import { clearDatabase } from '../__utils__/utils';
import { knex } from '../../src/dbconfig';
import { migrationsDirectory } from '../../knexfile';

describe('migrations', () => {
    beforeAll(async () => {
        await knex.migrate.rollback(
            {
                directory: migrationsDirectory,
            },
            true
        );
        await knex.migrate.up({
            name: '20210818142342_init.ts',
            directory: migrationsDirectory,
        });

        await knex('user').insert(user);
        await knex('accessToken').insert(accessToken);
        await knex('mediaItem').insert(mediaItem);
        await knex('season').insert(season);
        await knex('episode').insert(episode);
        await knex('seen').insert(seen);
        await knex('watchlist').insert(watchlist);
        await knex('userRating').insert(userRating);
        await knex('userRating').insert(userRating2);
        await knex('userRating').insert(userRating3);
        await knex('notificationsHistory').insert(notificationsHistory);
        await knex('notificationPlatformsCredentials').insert(
            notificationPlatformsCredentials
        );
    });

    test('20220121025651_ratingColumnFloat', async () => {
        await knex.migrate.up({
            name: '20220121025651_ratingColumnFloat.ts',
            directory: migrationsDirectory,
        });
        await knex.migrate.rollback({
            name: '20220121025651_ratingColumnFloat.ts',
            directory: migrationsDirectory,
        });
        await knex.migrate.up({
            name: '20220121025651_ratingColumnFloat.ts',
            directory: migrationsDirectory,
        });
    });

    test('20220122003141_bigIntToFloat', async () => {
        await knex.migrate.up({
            name: '20220122003141_bigIntToFloat.ts',
            directory: migrationsDirectory,
        });
        await knex.migrate.rollback({
            name: '20220122003141_bigIntToFloat.ts',
            directory: migrationsDirectory,
        });
        await knex.migrate.up({
            name: '20220122003141_bigIntToFloat.ts',
            directory: migrationsDirectory,
        });
    });

    afterAll(clearDatabase);
});

const user: User = {
    id: 1,
    name: 'admin',
    admin: true,
    password: 'password',
    publicReviews: false,
};

const accessToken: AccessToken = {
    id: 1,
    userId: user.id,
    description: 'token',
    token: 'token',
};

const mediaItem: MediaItemBase = {
    id: 1,
    lastTimeUpdated: new Date().getTime(),
    mediaType: 'tv',
    source: 'user',
    title: 'title',
};

const season: TvSeason = {
    id: 1,
    description: 'description',
    releaseDate: '2001-02-20',
    tvShowId: mediaItem.id,
    title: 'title',
    seasonNumber: 1,
    numberOfEpisodes: 1,
    isSpecialSeason: false,
};

const episode: TvEpisode = {
    id: 1,
    episodeNumber: 1,
    seasonId: season.id,
    tvShowId: mediaItem.id,
    isSpecialEpisode: false,
    seasonNumber: 1,
    title: 'Episode 1',
    releaseDate: '2001-02-20',
    seasonAndEpisodeNumber: 1001,
};

const watchlist: Watchlist = {
    id: 1,
    userId: user.id,
    mediaItemId: mediaItem.id,
};

const userRating: UserRating = {
    id: 1,
    mediaItemId: mediaItem.id,
    date: new Date().getTime(),
    userId: user.id,
    rating: 4,
    review: 'review',
};

const userRating2: UserRating = {
    id: 2,
    mediaItemId: mediaItem.id,
    date: new Date().getTime(),
    userId: user.id,
    rating: 3,
    review: 'review2',
    seasonId: season.id,
};

const userRating3: UserRating = {
    id: 3,
    mediaItemId: mediaItem.id,
    date: new Date().getTime(),
    userId: user.id,
    rating: 5,
    review: 'review3',
    episodeId: episode.id,
};

const seen: Seen = {
    id: 1,
    date: new Date().getTime(),
    mediaItemId: mediaItem.id,
    seasonId: season.id,
    episodeId: episode.id,
    userId: user.id,
};

const notificationPlatformsCredentials: NotificationPlatformsCredentials = {
    id: 1,
    name: 'key',
    platformName: 'platform',
    userId: user.id,
    value: 'value',
};

const notificationsHistory: NotificationsHistory = {
    id: 1,
    mediaItemId: mediaItem.id,
    episodeId: episode.id,
    sendDate: new Date().getTime(),
};
