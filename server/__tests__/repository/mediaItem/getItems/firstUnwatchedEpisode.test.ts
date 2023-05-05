import { mediaItemRepository } from 'src/repository/mediaItem';
import { MediaItemBaseWithSeasons } from 'src/entity/mediaItem';
import { TvEpisode } from 'src/entity/tvepisode';
import { User } from 'src/entity/user';
import { userRepository } from 'src/repository/user';
import { Seen } from 'src/entity/seen';
import { seenRepository } from 'src/repository/seen';
import { clearDatabase, runMigrations } from '../../../__utils__/utils';

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

const seenEpisodes: Seen[] = [
  {
    id: 1,
    date: new Date().getTime(),
    mediaItemId: 1,
    userId: user.id,
    episodeId: 1,
  },
  {
    id: 2,
    date: new Date().getTime(),
    mediaItemId: 1,
    userId: user.id,
    episodeId: 2,
  },
  {
    id: 3,
    date: new Date().getTime(),
    mediaItemId: 1,
    userId: user.id,
    episodeId: 3,
  },
  {
    id: 4,
    date: new Date().getTime(),
    mediaItemId: 1,
    userId: user2.id,
    episodeId: 4,
  },
  {
    id: 5,
    date: new Date().getTime(),
    mediaItemId: 1,
    userId: user2.id,
    episodeId: 1,
  },
];

const firstUnwatchedEpisode: TvEpisode = {
  id: 4,
  episodeNumber: 2,
  seasonId: 2,
  seasonNumber: 2,
  isSpecialEpisode: false,
  title: 'Episode 2',
  description: 'description',
  releaseDate: '2002-02-21',
  tvShowId: 1,
  runtime: 30,
  tmdbId: 123456,
  imdbId: 'imdbid',
  traktId: 678,
  tvdbId: 9213,
};

const mediaItem: MediaItemBaseWithSeasons = {
  id: 1,
  lastTimeUpdated: new Date().getTime(),
  mediaType: 'tv',
  source: 'user',
  title: 'title',
  slug: 'title',
  seasons: [
    {
      id: 1,
      seasonNumber: 1,
      numberOfEpisodes: 2,
      isSpecialSeason: false,
      title: 'Season 1',
      tvShowId: 1,
      episodes: [
        {
          id: 1,
          episodeNumber: 1,
          isSpecialEpisode: false,
          seasonId: 1,
          seasonNumber: 1,
          title: 'Episode 1',
          releaseDate: '2001-02-20',
          tvShowId: 1,
        },
        {
          id: 2,
          episodeNumber: 2,
          isSpecialEpisode: false,
          seasonId: 1,
          seasonNumber: 1,
          title: 'Episode 2',
          releaseDate: '2001-02-21',
          tvShowId: 1,
        },
      ],
    },
    {
      id: 2,
      seasonNumber: 2,
      numberOfEpisodes: 2,
      isSpecialSeason: false,
      title: 'Season 2',
      tvShowId: 1,
      episodes: [
        {
          id: 3,
          episodeNumber: 1,
          isSpecialEpisode: false,
          seasonId: 2,
          seasonNumber: 2,
          title: 'Episode 1',
          releaseDate: '2002-02-20',
          tvShowId: 1,
        },
        firstUnwatchedEpisode,
        {
          id: 5,
          episodeNumber: 3,
          isSpecialEpisode: false,
          seasonId: 2,
          seasonNumber: 2,
          title: 'Episode 3',
          releaseDate: '9999-02-20',
          tvShowId: 1,
        },
      ],
    },
  ],
};

describe('firstUnwatchedEpisode', () => {
  beforeAll(async () => {
    await runMigrations();
    await userRepository.create(user);
    await userRepository.create(user2);
    await mediaItemRepository.create(mediaItem);
    await seenRepository.createMany(seenEpisodes);
  });

  afterAll(clearDatabase);

  test('items', async () => {
    const [fetchedMediaItem] = await mediaItemRepository.items({
      userId: 1,
    });

    expect(fetchedMediaItem.firstUnwatchedEpisode).toStrictEqual({
      ...firstUnwatchedEpisode,
      userRating: undefined,
      seenHistory: undefined,
      lastSeenAt: undefined,
    });
  });

  test('items, user2', async () => {
    const [fetchedMediaItem] = await mediaItemRepository.items({
      userId: 2,
    });

    expect(fetchedMediaItem.firstUnwatchedEpisode).toMatchObject({
      id: 2,
    });
  });

  test('details', async () => {
    const fetchedMediaItem = await mediaItemRepository.details({
      userId: 1,
      mediaItemId: 1,
    });

    expect(fetchedMediaItem.firstUnwatchedEpisode).toMatchObject({
      ...firstUnwatchedEpisode,
      userRating: undefined,
      seenHistory: undefined,
      lastSeenAt: undefined,
      seen: false,
    });
  });

  test('details, user2', async () => {
    const fetchedMediaItem = await mediaItemRepository.details({
      userId: 2,
      mediaItemId: 1,
    });

    expect(fetchedMediaItem.firstUnwatchedEpisode).toMatchObject({
      id: 2,
    });
  });
});
