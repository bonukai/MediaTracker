import { Database } from 'src/dbconfig';
import { listItemRepository } from 'src/repository/listItemRepository';
import { Data } from '__tests__/__utils__/data';
import { clearDatabase, runMigrations } from '__tests__/__utils__/utils';

describe('listController', () => {
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

  test('ranks should be updated after removing listItem', async () => {
    await Database.knex('listItem').insert([
      {
        id: 0,
        listId: Data.list.id,
        addedAt: new Date().getTime(),
        mediaItemId: Data.book.id,
        rank: 0,
      },
      {
        id: 1,
        listId: Data.list.id,
        addedAt: new Date().getTime(),
        mediaItemId: Data.movie.id,
        rank: 1,
      },
      {
        id: 2,
        listId: Data.list.id,
        addedAt: new Date().getTime(),
        mediaItemId: Data.videoGame.id,
        rank: 3,
      },
      {
        id: 3,
        listId: Data.list.id,
        addedAt: new Date().getTime(),
        mediaItemId: Data.tvShow.id,
        rank: 2,
      },
    ]);

    await listItemRepository.removeItem({
      listId: Data.list.id,
      userId: Data.user.id,
      mediaItemId: Data.movie.id,
    });

    const listItems = await Database.knex('listItem')
      .where('listId', Data.list.id)
      .orderBy('rank');

    expect(listItems.map((listItem) => listItem.rank)).toEqual([0, 1, 2]);

    await Database.knex('listItem').delete();
  });

  test('adding items should set correct ranks', async () => {
    await listItemRepository.addItem({
      listId: Data.list.id,
      userId: Data.user.id,
      mediaItemId: Data.movie.id,
    });

    await listItemRepository.addItem({
      listId: Data.list.id,
      userId: Data.user.id,
      mediaItemId: Data.book.id,
    });

    await listItemRepository.addItem({
      listId: Data.list.id,
      userId: Data.user.id,
      mediaItemId: Data.videoGame.id,
    });

    const listItems = await Database.knex('listItem')
      .where('listId', Data.list.id)
      .orderBy('rank');

    expect(listItems.map((listItem) => listItem.rank)).toEqual([0, 1, 2]);

    await Database.knex('listItem').delete();
  });

  test('should remove only item with tvShow id', async () => {
    await listItemRepository.addItem({
      listId: Data.list.id,
      userId: Data.user.id,
      mediaItemId: Data.tvShow.id,
    });

    await listItemRepository.addItem({
      listId: Data.list.id,
      userId: Data.user.id,
      mediaItemId: Data.tvShow.id,
      seasonId: Data.season.id,
    });

    await listItemRepository.addItem({
      listId: Data.list.id,
      userId: Data.user.id,
      mediaItemId: Data.tvShow.id,
      episodeId: Data.episode.id,
    });

    await listItemRepository.removeItem({
      listId: Data.list.id,
      userId: Data.user.id,
      mediaItemId: Data.tvShow.id,
    });

    const episodeListItem = await Database.knex('listItem')
      .where('listId', Data.list.id)
      .where('mediaItemId', Data.tvShow.id)
      .where('episodeId', Data.episode.id)
      .first();

    const seasonListItem = await Database.knex('listItem')
      .where('listId', Data.list.id)
      .where('mediaItemId', Data.tvShow.id)
      .where('seasonId', Data.season.id)
      .first();

    expect(episodeListItem).toBeDefined();
    expect(seasonListItem).toBeDefined();

    await Database.knex('listItem').delete();
  });

  test('item with episode should have seasonId set to NULL', async () => {
    await listItemRepository.addItem({
      listId: Data.list.id,
      userId: Data.user.id,
      mediaItemId: Data.tvShow.id,
      seasonId: Data.episode.seasonId,
      episodeId: Data.episode.id,
    });

    const episodeListItem = await Database.knex('listItem')
      .where('listId', Data.list.id)
      .where('mediaItemId', Data.tvShow.id)
      .where('episodeId', Data.episode.id)
      .first();

    expect(episodeListItem.seasonId).toBeNull();

    await Database.knex('listItem').delete();
  });

  test('episode from different tvShow should not be allowed', async () => {
    expect(
      await listItemRepository.addItem({
        listId: Data.list.id,
        userId: Data.user.id,
        mediaItemId: Data.movie.id,
        episodeId: Data.episode.id,
      })
    ).toBe(false);

    const listItems = await Database.knex('listItem');

    expect(listItems).toEqual([]);

    await Database.knex('listItem').delete();
  });

  test('season from different tvShow should not be allowed', async () => {
    expect(
      await listItemRepository.addItem({
        listId: Data.list.id,
        userId: Data.user.id,
        mediaItemId: Data.movie.id,
        seasonId: Data.season.id,
      })
    ).toBe(false);

    const listItems = await Database.knex('listItem');

    expect(listItems).toEqual([]);

    await Database.knex('listItem').delete();
  });

  test('two identical episodes should not be allowed', async () => {
    await listItemRepository.addItem({
      listId: Data.list.id,
      userId: Data.user.id,
      mediaItemId: Data.episode.tvShowId,
      episodeId: Data.episode.id,
    });

    expect(
      await listItemRepository.addItem({
        listId: Data.list.id,
        userId: Data.user.id,
        mediaItemId: Data.episode.tvShowId,
        episodeId: Data.episode.id,
      })
    ).toBe(false);

    expect(
      await listItemRepository.addItem({
        listId: Data.list.id,
        userId: Data.user.id,
        mediaItemId: Data.episode.tvShowId,
        seasonId: Data.episode.seasonId,
        episodeId: Data.episode.id,
      })
    ).toBe(false);

    await Database.knex('listItem').delete();
  });

  test('two identical seasons should not be allowed', async () => {
    await listItemRepository.addItem({
      listId: Data.list.id,
      userId: Data.user.id,
      mediaItemId: Data.season.tvShowId,
      seasonId: Data.season.id,
    });

    expect(
      await listItemRepository.addItem({
        listId: Data.list.id,
        userId: Data.user.id,
        mediaItemId: Data.season.tvShowId,
        seasonId: Data.season.id,
      })
    ).toBe(false);

    await Database.knex('listItem').delete();
  });

  test('two identical items should not be allowed', async () => {
    await listItemRepository.addItem({
      listId: Data.list.id,
      userId: Data.user.id,
      mediaItemId: Data.season.tvShowId,
    });

    expect(
      await listItemRepository.addItem({
        listId: Data.list.id,
        userId: Data.user.id,
        mediaItemId: Data.season.tvShowId,
      })
    ).toBe(false);

    await Database.knex('listItem').delete();
  });
});
