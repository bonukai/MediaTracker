import { Database } from 'src/dbconfig';
import { listRepository } from 'src/repository/list';
import { Data } from '__tests__/__utils__/data';
import { clearDatabase, runMigrations } from '__tests__/__utils__/utils';

describe('delete list', () => {
  beforeAll(async () => {
    await runMigrations();

    await Database.knex('user').insert(Data.user);
    await Database.knex('user').insert(Data.user2);
    await Database.knex('mediaItem').insert(Data.movie);
    await Database.knex('mediaItem').insert(Data.book);
    await Database.knex('mediaItem').insert(Data.videoGame);
    await Database.knex('mediaItem').insert(Data.tvShow);
    await Database.knex('season').insert(Data.season);
    await Database.knex('episode').insert(Data.episode);
    await Database.knex('episode').insert(Data.episode2);
    await Database.knex('episode').insert(Data.episode3);
  });

  afterAll(clearDatabase);

  test('watchlist should not be deleted', async () => {
    const watchlist = await listRepository.create({
      userId: Data.user.id,
      name: 'Watchlist',
      isWatchlist: true,
    });

    await listRepository.delete({
      listId: watchlist.id,
      userId: Data.user.id,
    });

    expect(
      await Database.knex('list').where('id', watchlist.id).first()
    ).toBeDefined();
  });

  test('ranks should be updated after removing list', async () => {
    await Database.knex('list').delete();
    await listRepository.create({
      userId: Data.user.id,
      name: 'List 1',
      isWatchlist: false,
    });
    const list2 = await listRepository.create({
      userId: Data.user.id,
      name: 'List 2',
      isWatchlist: false,
    });
    await listRepository.create({
      userId: Data.user.id,
      name: 'List 3',
      isWatchlist: false,
    });
    await listRepository.create({
      userId: Data.user.id,
      name: 'List 4',
      isWatchlist: false,
    });
    await listRepository.create({
      userId: Data.user.id,
      name: 'List 5',
      isWatchlist: false,
    });

    await listRepository.delete({
      listId: list2.id,
      userId: Data.user.id,
    });

    const lists = await Database.knex('list')
      .select('name', 'rank')
      .where('userId', Data.user.id)
      .orderBy('rank');

    expect(lists).toEqual([
      { name: 'List 1', rank: 0 },
      { name: 'List 3', rank: 1 },
      { name: 'List 4', rank: 2 },
      { name: 'List 5', rank: 3 },
    ]);
  });
});
