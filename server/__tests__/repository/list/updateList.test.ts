import { Database } from 'src/dbconfig';
import { listRepository } from 'src/repository/list';
import { Data } from '__tests__/__utils__/data';
import { clearDatabase, runMigrations } from '__tests__/__utils__/utils';

describe('update list', () => {
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

  test('list with new name already taken should not be allowed', async () => {
    const list = await listRepository.create({
      name: 'list',
      userId: Data.user.id,
    });

    const list2 = await listRepository.create({
      name: 'list2',
      userId: Data.user.id,
    });

    expect(
      await listRepository.update({
        id: list2.id,
        userId: list2.userId,
        name: list.name,
      })
    ).toBeUndefined();

    const updatedList = await Database.knex('list')
      .where('id', list2.id)
      .first();

    expect(updatedList.name).toEqual(list2.name);

    await Database.knex('list').delete();
  });

  test('list with name already taken by other user should be allowed', async () => {
    const list = await listRepository.create({
      name: 'list',
      userId: Data.user2.id,
    });

    const list2 = await listRepository.create({
      name: 'list2',
      userId: Data.user.id,
    });

    expect(
      await listRepository.update({
        id: list2.id,
        userId: list2.userId,
        name: list.name,
      })
    ).toMatchObject({
      id: list2.id,
      userId: list2.userId,
      name: list.name,
    });

    const updatedList = await Database.knex('list')
      .where('id', list2.id)
      .first();

    expect(updatedList.name).toEqual(list.name);

    await Database.knex('list').delete();
  });

  test('list with empty name should not be allowed', async () => {
    const list = await listRepository.create({
      name: 'list',
      userId: Data.user2.id,
    });

    expect(
      await listRepository.update({
        id: list.id,
        userId: list.userId,
        name: '',
      })
    ).toBeUndefined();

    const updatedList = await Database.knex('list')
      .where('id', list.id)
      .first();

    expect(updatedList.name).toEqual(list.name);

    await Database.knex('list').delete();
  });

  test('should update list', async () => {
    const list = await listRepository.create({
      name: 'list',
      userId: Data.user2.id,
    });

    const newName = 'abc';
    const newDescription = '12345';
    const newPrivacy = 'public';

    expect(
      await listRepository.update({
        id: list.id,
        userId: list.userId,
        name: newName,
        description: newDescription,
        privacy: newPrivacy,
      })
    ).toMatchObject({
      id: list.id,
      userId: list.userId,
      name: newName,
      description: newDescription,
      privacy: newPrivacy,
    });

    const updatedList = await Database.knex('list')
      .where('id', list.id)
      .first();

    expect(updatedList.name).toEqual(newName);
    expect(updatedList.description).toEqual(newDescription);
    expect(updatedList.privacy).toEqual(newPrivacy);

    await Database.knex('list').delete();
  });
});
