import _ from 'lodash';

import { Database } from 'src/dbconfig';
import { MediaItemBase } from 'src/entity/mediaItem';
import { mediaItemRepository } from 'src/repository/mediaItem';
import { clearDatabase, runMigrations } from '../../__utils__/utils';

const mediaItems: MediaItemBase[] = [
  {
    id: 0,
    title: 'title 0',
    slug: 'title-0',
    mediaType: 'movie',
    source: 'user',
    lockedAt: new Date(2000, 10, 2).getTime(),
  },
  {
    id: 1,
    title: 'title 1',
    slug: 'title-1',
    mediaType: 'movie',
    source: 'user',
    lockedAt: null,
  },
  {
    id: 2,
    title: 'title 2',
    slug: 'title-2',
    mediaType: 'movie',
    source: 'user',
    lockedAt: new Date().getTime() - 23 * 60 * 60 * 1000,
  },
  {
    id: 3,
    title: 'title 3',
    slug: 'title-3',
    mediaType: 'movie',
    source: 'user',
    lockedAt: new Date().getTime(),
  },
];

describe('unlockLockedMediaItems.test', () => {
  beforeAll(async () => {
    await runMigrations();
    await Database.knex('mediaItem').insert(mediaItems);
  });

  afterAll(clearDatabase);

  test('should unlock only items locked 24 earlier', async () => {
    const res = await mediaItemRepository.unlockLockedMediaItems();

    expect(res).toEqual(1);

    const updatedMediaItems = await Database.knex('mediaItem').orderBy(
      'id',
      'asc'
    );

    expect(
      updatedMediaItems.map((item) => ({
        id: item.id,
        lockedAt: item.lockedAt,
      }))
    ).toEqual([
      {
        id: 0,
        lockedAt: null,
      },
      {
        id: 1,
        lockedAt: null,
      },
      {
        id: 2,
        lockedAt: mediaItems[2].lockedAt,
      },
      {
        id: 3,
        lockedAt: mediaItems[3].lockedAt,
      },
    ]);
  });
});
