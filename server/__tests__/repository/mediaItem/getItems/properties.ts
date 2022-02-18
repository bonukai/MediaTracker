import { mediaItemRepository } from 'src/repository/mediaItem';
import { MediaItemBase } from 'src/entity/mediaItem';
import { User } from 'src/entity/user';
import { Watchlist } from 'src/entity/watchlist';
import { userRepository } from 'src/repository/user';
import { watchlistRepository } from 'src/repository/watchlist';
import { clearDatabase, runMigrations } from '../../../__utils__/utils';

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
  password: 'password',
};

const watchlist: Watchlist = {
  id: 1,
  mediaItemId: mediaItem.id,
  userId: user.id,
};

describe('properties', () => {
  beforeAll(async () => {
    await runMigrations();
    await userRepository.create(user);
    await mediaItemRepository.create(mediaItem);
    await watchlistRepository.create(watchlist);
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
