import { Database } from 'src/dbconfig';
import { listItemRepository } from 'src/repository/listItemRepository';
import { mediaItemRepository } from 'src/repository/mediaItem';
import { Data } from '__tests__/__utils__/data';
import { clearDatabase, runMigrations } from '__tests__/__utils__/utils';

describe('itemsToPossiblyUpdate', () => {
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

    await Database.knex('user').insert(Data.user);
    await Database.knex('list').insert(Data.list);
  });

  afterAll(clearDatabase);

  test('should return empty list', async () => {
    expect(await mediaItemRepository.itemsToPossiblyUpdate()).toEqual([]);
  });

  test('should return mediaItem with episode on list', async () => {
    await listItemRepository.addItem({
      userId: Data.user.id,
      listId: Data.list.id,
      mediaItemId: Data.episode.tvShowId,
      episodeId: Data.episode.id,
    });

    const res = await mediaItemRepository.itemsToPossiblyUpdate();

    expect(res.length).toEqual(1);

    expect(res[0]).toMatchObject({
      id: Data.tvShow.id,
    });

    await Database.knex('listItem').delete();
  });

  test('should return mediaItem on list', async () => {
    await listItemRepository.addItem({
      userId: Data.user.id,
      listId: Data.list.id,
      mediaItemId: Data.book.id,
    });

    const res = await mediaItemRepository.itemsToPossiblyUpdate();

    expect(res.length).toEqual(1);

    expect(res[0]).toMatchObject({
      id: Data.book.id,
    });

    await Database.knex('listItem').delete();
  });

  test('should ignore items added by user', async () => {
    const mediaItem = {
      id: 123,
      lastTimeUpdated: new Date().getTime(),
      mediaType: 'movie',
      source: 'user',
      title: 'UserMovie',
      poster: 'posterUrl',
      backdrop: 'backdropUrl',
      releaseDate: '2001-04-12',
      tmdbId: 999,
      runtime: 124,
    };

    await Database.knex('mediaItem').insert(mediaItem);

    await listItemRepository.addItem({
      userId: Data.user.id,
      listId: Data.list.id,
      mediaItemId: mediaItem.id,
    });

    const res = await mediaItemRepository.itemsToPossiblyUpdate();

    expect(res.length).toEqual(0);

    await Database.knex('listItem').delete();
  });
});
