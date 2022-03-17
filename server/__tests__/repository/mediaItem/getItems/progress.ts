import _ from 'lodash';

import { mediaItemRepository } from 'src/repository/mediaItem';
import { MediaItemBase } from 'src/entity/mediaItem';
import { User } from 'src/entity/user';
import { userRepository } from 'src/repository/user';
import { Seen } from 'src/entity/seen';
import { seenRepository } from 'src/repository/seen';
import { clearDatabase, runMigrations } from '../../../__utils__/utils';
import { Watchlist } from 'src/entity/watchlist';
import { watchlistRepository } from 'src/repository/watchlist';

const user: User = {
  id: 1,
  name: 'admin',
  slug: 'admin',
  admin: true,
  password: 'password',
  publicReviews: false,
};

const user2: User = {
  id: 2,
  name: 'user',
  slug: 'user',
  admin: false,
  password: 'password',
  publicReviews: false,
};

const mediaItem: MediaItemBase = {
  id: 1,
  lastTimeUpdated: new Date().getTime(),
  mediaType: 'book',
  source: 'user',
  title: 'title',
  slug: 'title',
};

const watchlist: Watchlist = {
  userId: user.id,
  mediaItemId: mediaItem.id,
};

const watchlist2: Watchlist = {
  userId: user2.id,
  mediaItemId: mediaItem.id,
};

const date = new Date().getTime();

const progress: Seen = {
  date: date,
  userId: user.id,
  mediaItemId: mediaItem.id,
  type: 'progress',
  progress: 0.8,
};

const progress2: Seen = {
  date: date,
  userId: user2.id,
  mediaItemId: mediaItem.id,
  type: 'progress',
  progress: 0.4,
};

const progress3: Seen[] = [
  {
    date: date - 1,
    userId: user.id,
    mediaItemId: mediaItem.id,
    type: 'progress',
    progress: 0.3,
  },
  {
    date: date - 2,
    userId: user.id,
    mediaItemId: mediaItem.id,
    type: 'progress',
    progress: 0.2,
  },
  {
    date: date - 3,
    userId: user.id,
    mediaItemId: mediaItem.id,
    type: 'progress',
    progress: 0.1,
  },
];

describe('progress', () => {
  beforeAll(runMigrations);

  beforeAll(async () => {
    await mediaItemRepository.create(mediaItem);
    await userRepository.create(user);
    await userRepository.create(user2);
    await watchlistRepository.create(watchlist);
    await watchlistRepository.create(watchlist2);
    await seenRepository.create(progress);
    await seenRepository.create(progress2);
    await seenRepository.createMany(progress3);
  });

  afterAll(clearDatabase);

  test('items, user', async () => {
    const [res] = await mediaItemRepository.items({
      userId: user.id,
    });

    expect(res.progress).toEqual(progress.progress);
  });

  test('items, user2', async () => {
    const [res] = await mediaItemRepository.items({
      userId: user2.id,
    });

    expect(res.progress).toEqual(progress2.progress);
  });

  test('details, user', async () => {
    const res = await mediaItemRepository.details({
      mediaItemId: mediaItem.id,
      userId: user.id,
    });

    expect(res.progress).toEqual(progress.progress);
  });

  test('details, user2', async () => {
    const res = await mediaItemRepository.details({
      mediaItemId: mediaItem.id,
      userId: user2.id,
    });

    expect(res.progress).toEqual(progress2.progress);
  });

  test('should return null, when progress is 1', async () => {
    await seenRepository.create({
      date: new Date().getTime(),
      mediaItemId: mediaItem.id,
      userId: user.id,
      progress: 1,
      type: 'progress',
    });

    const [res] = await mediaItemRepository.items({
      userId: user.id,
    });

    expect(res.progress).toBeNull();

    const details = await mediaItemRepository.details({
      mediaItemId: mediaItem.id,
      userId: user.id,
    });

    expect(details.progress).toBeNull();
  });
});
