import { mediaItemRepository } from 'src/repository/mediaItem';
import { MediaItemBase } from 'src/entity/mediaItem';
import { User } from 'src/entity/user';
import { userRepository } from 'src/repository/user';
import { clearDatabase, runMigrations } from '../../../__utils__/utils';
import { listItemRepository } from 'src/repository/listItemRepository';

const mediaItem: MediaItemBase = {
  developer: 'developer',
  genres: ['genre1', 'genre2'],
  id: 1,
  igdbId: 123456,
  imdbId: 'imdbId',
  lastTimeUpdated: new Date().getTime(),
  mediaType: 'tv',
  network: 'network',
  openlibraryId: '1234567',
  originalTitle: 'originalTitle',
  overview: 'overview',
  platform: ['platform'],
  releaseDate: '2021-02-28',
  runtime: 30,
  source: 'user',
  status: 'status',
  title: 'title',
  slug: 'title-2021',
  tmdbId: 4351,
  tmdbRating: 9.1,
  tvmazeId: 123845,
  url: 'www.localhost.com',
  authors: ['author1', 'author2'],
  narrators: ['narrator1', 'narrator2'],
  language: 'en',
};

const user: User = {
  id: 1,
  name: 'user',
  slug: 'user',
  password: 'password',
};

describe('properties', () => {
  beforeAll(async () => {
    await runMigrations();
    await userRepository.create(user);
    await mediaItemRepository.create(mediaItem);

    listItemRepository.addItem({
      userId: user.id,
      watchlist: true,
      mediaItemId: mediaItem.id,
    });
  });

  afterAll(clearDatabase);

  test('items', async () => {
    const [fetchedMediaItem] = await mediaItemRepository.items({
      userId: 1,
    });
    expect(fetchedMediaItem).toMatchObject(mediaItem);
  });

  test('details', async () => {
    const fetchedMediaItem = await mediaItemRepository.details({
      mediaItemId: 1,
      userId: 1,
    });

    expect(fetchedMediaItem).toMatchObject(mediaItem);
  });
});
