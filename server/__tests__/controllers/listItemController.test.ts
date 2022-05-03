import { ListItemController } from 'src/controllers/listItemController';
import { Database } from 'src/dbconfig';
import { Data } from '__tests__/__utils__/data';
import { request } from '__tests__/__utils__/request';
import { clearDatabase, runMigrations } from '__tests__/__utils__/utils';

describe('listItemController', () => {
  beforeAll(async () => {
    await runMigrations();

    await Database.knex('user').insert(Data.user);
    await Database.knex('mediaItem').insert(Data.movie);
    await Database.knex('mediaItem').insert(Data.book);
    await Database.knex('mediaItem').insert(Data.videoGame);
    await Database.knex('mediaItem').insert(Data.tvShow);
    await Database.knex('season').insert(Data.season);
    await Database.knex('episode').insert(Data.episode);
    await Database.knex('episode').insert(Data.episode2);
    await Database.knex('episode').insert(Data.episode3);

    await Database.knex('list').insert(Data.list);
  });

  afterAll(clearDatabase);

  test('should add item to list', async () => {
    const listItemController = new ListItemController();

    await request(listItemController.addItem, {
      userId: Data.user.id,
      requestQuery: {
        listId: Data.list.id,
        mediaItemId: Data.movie.id,
      },
    });

    const res = await Database.knex('listItem')
      .where('mediaItemId', Data.movie.id)
      .where('listId', Data.list.id)
      .first();

    expect(res).toBeDefined();
  });

  test('should remove item from list', async () => {
    const listItemController = new ListItemController();

    await request(listItemController.removeItem, {
      userId: Data.user.id,
      requestQuery: {
        listId: Data.list.id,
        mediaItemId: Data.movie.id,
      },
    });

    const res = await Database.knex('listItem')
      .where('mediaItemId', Data.movie.id)
      .where('listId', Data.list.id)
      .first();

    expect(res).toBeUndefined();

    await Database.knex('listItem').delete();
  });
});
