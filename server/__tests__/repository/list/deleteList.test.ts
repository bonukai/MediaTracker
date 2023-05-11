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
});
