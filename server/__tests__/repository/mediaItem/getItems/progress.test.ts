import _ from 'lodash';

import { mediaItemRepository } from 'src/repository/mediaItem';
import { MediaItemBase } from 'src/entity/mediaItem';
import { User } from 'src/entity/user';
import { userRepository } from 'src/repository/user';
import { clearDatabase, runMigrations } from '../../../__utils__/utils';
import { Progress } from 'src/entity/progress';
import { progressRepository } from 'src/repository/progress';
import { seenRepository } from 'src/repository/seen';

const user: User = {
  id: 1,
  name: 'admin',
  admin: true,
  password: 'password',
  publicReviews: false,
};

const user2: User = {
  id: 2,
  name: 'user',
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

const date = new Date().getTime();

const progress: Progress = {
  date: date,
  userId: user.id,
  mediaItemId: mediaItem.id,
  progress: 0.8,
};

const progress2: Progress = {
  date: date,
  userId: user2.id,
  mediaItemId: mediaItem.id,
  progress: 0.4,
};

describe('progress', () => {
  beforeAll(runMigrations);

  beforeAll(async () => {
    await mediaItemRepository.create(mediaItem);
    await userRepository.create(user);
    await userRepository.create(user2);
    await seenRepository.create(_.omit(progress, 'progress'));
    await seenRepository.create(_.omit(progress2, 'progress'));
    await progressRepository.create(progress);
    await progressRepository.create(progress2);
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
});
