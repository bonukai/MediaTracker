import { Database } from 'src/dbconfig';
import { clearDatabase, runMigrations } from '__tests__/__utils__/utils';

const mediaItem = {
  id: 1,
  title: 'title',
  slug: 'title',
  source: 'user',
};

const season = {
  id: 1,
  title: 'title',
  seasonNumber: 1,
  isSpecialSeason: false,
  tvShowId: mediaItem.id,
  numberOfEpisodes: 1,
};

const episode = {
  id: 1,
  seasonNumber: 1,
  episodeNumber: 1,
  seasonAndEpisodeNumber: 1001,
  isSpecialEpisode: false,
  title: 'title',
  tvShowId: mediaItem.id,
  seasonId: season.id,
};

const user = {
  id: 1,
  name: 'user',
  slug: 'user',
  password: 'password',
};

const list = {
  id: 1,
  name: 'list',
  slug: 'list',
  privacy: 'private',
  createdAt: new Date().getTime(),
  updatedAt: new Date().getTime(),
  userId: user.id,
  isWatchlist: false,
  sortBy: 'recently-watched',
  sortOrder: 'desc',
  rank: 0,
};

describe('foreign keys', () => {
  beforeAll(async () => {
    await runMigrations();

    await Database.knex('user').insert(user);
    await Database.knex('mediaItem').insert(mediaItem);
    await Database.knex('season').insert(season);
    await Database.knex('episode').insert(episode);
    await Database.knex('list').insert(list);
  });
  afterAll(clearDatabase);

  test('accessToken', async () => {
    await expect(async () =>
      Database.knex('accessToken').insert({
        id: 999,
        token: 'token',
        description: 'token',
        userId: 999,
      })
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_FOREIGNKEY' });
  });

  test('episode', async () => {
    await expect(async () =>
      Database.knex('episode').insert({
        id: 999,
        seasonNumber: 1,
        episodeNumber: 2,
        seasonAndEpisodeNumber: 1001,
        isSpecialEpisode: false,
        title: 'title',
        tvShowId: mediaItem.id,
        seasonId: 999,
      })
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_FOREIGNKEY' });

    await expect(async () =>
      Database.knex('episode').insert({
        id: 999,
        seasonNumber: 1,
        episodeNumber: 2,
        seasonAndEpisodeNumber: 1001,
        isSpecialEpisode: false,
        title: 'title',
        tvShowId: 999,
        seasonId: season.id,
      })
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_FOREIGNKEY' });
  });

  test('image', async () => {
    await expect(async () =>
      Database.knex('image').insert({
        id: 999,
        type: 'poster',
        mediaItemId: 999,
        seasonId: season.id,
      })
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_FOREIGNKEY' });

    await expect(async () =>
      Database.knex('image').insert({
        id: 999,
        type: 'poster',
        mediaItemId: mediaItem.id,
        seasonId: 999,
      })
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_FOREIGNKEY' });
  });

  test('list', async () => {
    await expect(async () =>
      Database.knex('list').insert({
        id: 999,
        name: 'list2',
        slug: 'list2',
        privacy: 'private',
        sortBy: 'recently-watched',
        sortOrder: 'desc',
        createdAt: new Date().getTime(),
        updatedAt: new Date().getTime(),
        userId: 999,
        rank: 1,
        isWatchlist: false,
      })
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_FOREIGNKEY' });
  });

  test('listItem', async () => {
    await expect(async () =>
      Database.knex('listItem').insert({
        id: 999,
        listId: 999,
        mediaItemId: mediaItem.id,
        seasonId: season.id,
        episodeId: episode.id,
        addedAt: new Date().getTime(),
        rank: 1,
      })
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_FOREIGNKEY' });

    await expect(async () =>
      Database.knex('listItem').insert({
        id: 999,
        listId: list.id,
        mediaItemId: 999,
        seasonId: season.id,
        episodeId: episode.id,
        addedAt: new Date().getTime(),
        rank: 1,
      })
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_FOREIGNKEY' });

    await expect(async () =>
      Database.knex('listItem').insert({
        id: 999,
        listId: list.id,
        mediaItemId: mediaItem.id,
        seasonId: 999,
        episodeId: episode.id,
        addedAt: new Date().getTime(),
        rank: 1,
      })
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_FOREIGNKEY' });

    await expect(async () =>
      Database.knex('listItem').insert({
        id: 999,
        listId: list.id,
        mediaItemId: mediaItem.id,
        seasonId: season.id,
        episodeId: 999,
        addedAt: new Date().getTime(),
        rank: 1,
      })
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_FOREIGNKEY' });
  });

  test('notificationPlatformsCredentials', async () => {
    await expect(async () =>
      Database.knex('notificationPlatformsCredentials').insert({
        id: 999,
        userId: 999,
        platformName: 'name',
        name: 'name',
        value: 'value',
      })
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_FOREIGNKEY' });
  });

  test('notificationsHistory', async () => {
    await expect(async () =>
      Database.knex('notificationsHistory').insert({
        id: 999,
        mediaItemId: mediaItem.id,
        episodeId: 999,
        sendDate: new Date().getTime(),
      })
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_FOREIGNKEY' });

    await expect(async () =>
      Database.knex('notificationsHistory').insert({
        id: 999,
        mediaItemId: 999,
        episodeId: episode.id,
        sendDate: new Date().getTime(),
      })
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_FOREIGNKEY' });
  });

  test('season', async () => {
    await expect(async () =>
      Database.knex('season').insert({
        id: 999,
        title: 'title',
        seasonNumber: 1,
        isSpecialSeason: false,
        tvShowId: 999,
        numberOfEpisodes: 1,
      })
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_FOREIGNKEY' });
  });

  test('seen', async () => {
    await expect(async () =>
      Database.knex('seen').insert({
        id: 999,
        date: new Date().getTime(),
        mediaItemId: 999,
        episodeId: episode.id,
        userId: user.id,
        type: 'seen',
      })
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_FOREIGNKEY' });

    await expect(async () =>
      Database.knex('seen').insert({
        id: 999,
        date: new Date().getTime(),
        mediaItemId: mediaItem.id,
        episodeId: 999,
        userId: user.id,
        type: 'seen',
      })
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_FOREIGNKEY' });

    await expect(async () =>
      Database.knex('seen').insert({
        id: 999,
        date: new Date().getTime(),
        mediaItemId: mediaItem.id,
        episodeId: episode.id,
        userId: 999,
        type: 'seen',
      })
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_FOREIGNKEY' });
  });

  test('userRating', async () => {
    await expect(async () =>
      Database.knex('userRating').insert({
        id: 999,
        mediaItemId: 999,
        episodeId: episode.id,
        userId: user.id,
      })
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_FOREIGNKEY' });

    await expect(async () =>
      Database.knex('userRating').insert({
        id: 999,
        mediaItemId: mediaItem.id,
        episodeId: 999,
        userId: user.id,
      })
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_FOREIGNKEY' });

    await expect(async () =>
      Database.knex('userRating').insert({
        id: 999,
        mediaItemId: mediaItem.id,
        episodeId: episode.id,
        userId: 999,
      })
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_FOREIGNKEY' });
  });
});
