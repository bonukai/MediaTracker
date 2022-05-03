import { Database } from 'src/dbconfig';
import { listRepository } from 'src/repository/list';
import { listItemRepository } from 'src/repository/listItemRepository';
import { Data } from '__tests__/__utils__/data';
import { clearDatabase, runMigrations } from '__tests__/__utils__/utils';

describe('get list items', () => {
  beforeAll(async () => {
    await runMigrations();

    await Database.knex('user').insert(Data.user);
    await Database.knex('user').insert(Data.user2);
    await Database.knex('mediaItem').insert(Data.movie);
    await Database.knex('mediaItem').insert(Data.book);
    await Database.knex('mediaItem').insert(Data.videoGame);
    await Database.knex('mediaItem').insert(Data.tvShow);
    await Database.knex('season').insert(Data.season);

    await Database.knex('episode').insert(episodeWithRuntime);
    await Database.knex('episode').insert(episodeWithoutRuntime);
    await Database.knex('episode').insert(specialEpisodeWithRuntime);

    await Database.knex('list').insert(Data.list);
    await Database.knex('list').insert(Data.watchlist);
    await Database.knex('list').insert(Data.listUser2);
  });

  afterAll(clearDatabase);

  test('MediaItem totalRuntime should not add special episodes', async () => {
    await listItemRepository.addItem({
      listId: Data.list.id,
      userId: Data.user.id,
      mediaItemId: Data.tvShow.id,
    });

    const [res] = await listRepository.items({
      listId: Data.list.id,
      userId: Data.user.id,
    });

    expect(res.mediaItem.totalRuntime).toBe(
      episodeWithRuntime.runtime + Data.tvShow.runtime
    );

    await Database.knex('listItem').delete();
  });

  test('Season totalRuntime should not add special episodes', async () => {
    await listItemRepository.addItem({
      listId: Data.list.id,
      userId: Data.user.id,
      mediaItemId: Data.tvShow.id,
      seasonId: Data.season.id,
    });

    const [res] = await listRepository.items({
      listId: Data.list.id,
      userId: Data.user.id,
    });

    expect(res.season.totalRuntime).toBe(
      episodeWithRuntime.runtime + Data.tvShow.runtime
    );

    await Database.knex('listItem').delete();
  });
});

const episodeWithoutRuntime = {
  id: 1,
  episodeNumber: 1,
  isSpecialEpisode: false,
  releaseDate: '2000-04-01',
  seasonAndEpisodeNumber: Data.season.seasonNumber * 1000 + 1,
  seasonId: Data.season.id,
  seasonNumber: Data.season.seasonNumber,
  title: 'Episode 1',
  tvShowId: Data.tvShow.id,
};

const episodeWithRuntime = {
  id: 2,
  episodeNumber: 2,
  isSpecialEpisode: false,
  releaseDate: '2000-04-07',
  seasonAndEpisodeNumber: Data.season.seasonNumber * 1000 + 2,
  seasonId: Data.season.id,
  seasonNumber: Data.season.seasonNumber,
  title: 'Episode 2',
  tvShowId: Data.tvShow.id,
  runtime: 41,
};

const specialEpisodeWithRuntime = {
  id: 3,
  episodeNumber: 0,
  isSpecialEpisode: true,
  releaseDate: '2000-04-01',
  seasonAndEpisodeNumber: Data.season.seasonNumber * 1000 + 0,
  seasonId: Data.season.id,
  seasonNumber: Data.season.seasonNumber,
  title: 'Episode 2',
  tvShowId: Data.tvShow.id,
  runtime: 44,
};
