import { Database } from 'src/dbconfig';
import { listRepository } from 'src/repository/list';
import { Data } from '__tests__/__utils__/data';
import { clearDatabase, runMigrations } from '__tests__/__utils__/utils';

describe('create list', () => {
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

  test('should not create list with empty name', async () => {
    expect(
      await listRepository.create({
        userId: Data.user.id,
        name: '',
      })
    ).toBeUndefined();
  });

  test('should add list', async () => {
    expect(
      await listRepository.create({
        userId: Data.user.id,
        name: 'list',
        description: 'description',
      })
    ).toMatchObject({
      userId: Data.user.id,
      name: 'list',
      slug: 'list',
      privacy: 'private',
      description: 'description',
      rank: 0,
    });

    expect(
      await listRepository.create({
        userId: Data.user.id,
        name: 'list2',
      })
    ).toMatchObject({
      userId: Data.user.id,
      name: 'list2',
      rank: 1,
    });
  });
});
