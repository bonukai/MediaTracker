import { Database } from 'src/dbconfig';
import { listItemRepository } from 'src/repository/listItemRepository';
import { userRepository } from 'src/repository/user';
import { Data } from '__tests__/__utils__/data';
import { clearDatabase, runMigrations } from '__tests__/__utils__/utils';

describe('findUsersWithMediaItemOnWatchlist.test', () => {
  beforeAll(async () => {
    await runMigrations();

    await Database.knex('mediaItem').insert(Data.movie);
    await Database.knex('mediaItem').insert(Data.book);
    await Database.knex('mediaItem').insert(Data.videoGame);
    await Database.knex('mediaItem').insert(Data.tvShow);
    await Database.knex('season').insert(Data.season);
    await Database.knex('episode').insert(Data.episode);
    await Database.knex('episode').insert(Data.episode2);
    await Database.knex('episode').insert(Data.episode3);
  });

  test('should return user with episode on watchlist', async () => {
    const userId = await userRepository.create({
      name: 'user',
      password: 'password',
    });

    await listItemRepository.addItem({
      userId: userId,
      mediaItemId: Data.tvShow.id,
      episodeId: Data.episode2.id,
      watchlist: true,
    });

    const [res] = await userRepository.findUsersWithMediaItemOnWatchlist({
      mediaItemId: Data.tvShow.id,
    });

    expect(res).toMatchObject({ id: userId });

    await Database.knex('listItem').delete();
    await Database.knex('list').delete();
    await Database.knex('user').delete();
  });

  test('should return user with movie on watchlist', async () => {
    const userId = await userRepository.create({
      name: 'user',
      password: 'password',
    });

    await listItemRepository.addItem({
      userId: userId,
      mediaItemId: Data.movie.id,
      watchlist: true,
    });

    const [res] = await userRepository.findUsersWithMediaItemOnWatchlist({
      mediaItemId: Data.movie.id,
    });

    expect(res).toMatchObject({ id: userId });

    await Database.knex('listItem').delete();
    await Database.knex('list').delete();
    await Database.knex('user').delete();
  });

  test('should return empty response for different mediaItemId', async () => {
    const userId = await userRepository.create({
      name: 'user',
      password: 'password',
    });

    await listItemRepository.addItem({
      userId: userId,
      mediaItemId: Data.tvShow.id,
      episodeId: Data.episode2.id,
      watchlist: true,
    });

    const res = await userRepository.findUsersWithMediaItemOnWatchlist({
      mediaItemId: Data.movie.id,
    });

    expect(res).toEqual([]);

    await Database.knex('listItem').delete();
    await Database.knex('list').delete();
    await Database.knex('user').delete();
  });

  test('should return users with correct notification settings', async () => {
    const userId = await userRepository.create({
      name: 'user',
      password: 'password',
      sendNotificationForReleases: false,
      sendNotificationForEpisodesReleases: false,
    });

    await listItemRepository.addItem({
      userId: userId,
      mediaItemId: Data.movie.id,
      watchlist: true,
    });

    expect(
      await userRepository.findUsersWithMediaItemOnWatchlist({
        mediaItemId: Data.movie.id,
        sendNotificationForReleases: true,
        sendNotificationForEpisodesReleases: true,
      })
    ).toEqual([]);

    expect(
      await userRepository.findUsersWithMediaItemOnWatchlist({
        mediaItemId: Data.movie.id,
        sendNotificationForReleases: false,
        sendNotificationForEpisodesReleases: true,
      })
    ).toEqual([]);

    expect(
      await userRepository.findUsersWithMediaItemOnWatchlist({
        mediaItemId: Data.movie.id,
        sendNotificationForReleases: true,
        sendNotificationForEpisodesReleases: false,
      })
    ).toEqual([]);

    const [res] = await userRepository.findUsersWithMediaItemOnWatchlist({
      mediaItemId: Data.movie.id,
      sendNotificationForReleases: false,
      sendNotificationForEpisodesReleases: false,
    });

    expect(res).toMatchObject({ id: userId });

    await Database.knex('listItem').delete();
    await Database.knex('list').delete();
    await Database.knex('user').delete();
  });

  afterAll(clearDatabase);
});
