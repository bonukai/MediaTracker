import _ from 'lodash';

import { mediaItemRepository } from 'src/repository/mediaItem';
import { MediaItemBaseWithSeasons } from 'src/entity/mediaItem';
import { TvEpisode } from 'src/entity/tvepisode';
import { User } from 'src/entity/user';
import { userRepository } from 'src/repository/user';
import { clearDatabase, runMigrations } from '../../../__utils__/utils';
import { listItemRepository } from 'src/repository/listItemRepository';

const upcomingEpisode: TvEpisode = {
  id: 7,
  episodeNumber: 2,
  seasonId: 2,
  seasonNumber: 2,
  title: 'Episode 2',
  description: 'description',
  imdbId: 'imdbId',
  runtime: 29,
  tmdbId: 12345,
  releaseDate: '9999-02-20',
  tvShowId: 1,
  isSpecialEpisode: false,
  traktId: 678,
  tvdbId: 9213,
};

const mediaItems: MediaItemBaseWithSeasons[] = [
  {
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
        title: 'Season 1',
        isSpecialSeason: false,
        episodes: [
          {
            id: 1,
            episodeNumber: 1,
            seasonNumber: 1,
            title: 'Episode 1',
            releaseDate: '2001-02-20',
            isSpecialEpisode: false,
          },
          {
            id: 2,
            episodeNumber: 2,
            seasonNumber: 1,
            title: 'Episode 2',
            releaseDate: '2001-02-21',
            isSpecialEpisode: false,
          },
        ],
      },
      {
        id: 2,
        seasonNumber: 2,
        numberOfEpisodes: 2,
        title: 'Season 2',
        isSpecialSeason: false,
        episodes: [
          {
            id: 3,
            episodeNumber: 1,
            seasonNumber: 2,
            title: 'Episode 1',
            releaseDate: '2002-02-20',
            isSpecialEpisode: false,
          },
          upcomingEpisode,
        ],
      },
    ],
  },
  {
    id: 2,
    lastTimeUpdated: new Date().getTime(),
    mediaType: 'tv',
    source: 'user',
    title: 'title2',
    slug: 'title2',
    seasons: [
      {
        id: 3,
        seasonNumber: 1,
        numberOfEpisodes: 2,
        title: 'Season 1',
        isSpecialSeason: false,
        episodes: [
          {
            id: 4,
            episodeNumber: 1,
            seasonId: 1,
            seasonNumber: 3,
            title: 'Episode 1',
            releaseDate: '2001-02-20',
            isSpecialEpisode: false,
          },
          {
            id: 5,
            episodeNumber: 2,
            seasonId: 1,
            seasonNumber: 3,
            title: 'Episode 2',
            releaseDate: '2001-02-21',
            isSpecialEpisode: false,
          },
        ],
      },
    ],
  },
  {
    id: 3,
    lastTimeUpdated: new Date().getTime(),
    mediaType: 'tv',
    source: 'user',
    title: 'title3',
    slug: 'title3',
    seasons: [
      {
        id: 4,
        seasonNumber: 1,
        numberOfEpisodes: 0,
        title: 'Season 1',
        isSpecialSeason: false,
        episodes: [],
      },
    ],
  },
  {
    id: 4,
    lastTimeUpdated: new Date().getTime(),
    mediaType: 'movie',
    source: 'user',
    title: 'title4',
    slug: 'title4',
  },
  {
    id: 5,
    lastTimeUpdated: new Date().getTime(),
    mediaType: 'video_game',
    source: 'user',
    title: 'title5',
    slug: 'title5',
  },
  {
    id: 6,
    lastTimeUpdated: new Date().getTime(),
    mediaType: 'book',
    source: 'user',
    title: 'title6',
    slug: 'title6',
  },
  {
    id: 7,
    lastTimeUpdated: new Date().getTime(),
    mediaType: 'tv',
    source: 'user',
    title: 'title7',
    slug: 'title7',
    seasons: [
      {
        id: 5,
        seasonNumber: 1,
        numberOfEpisodes: 1,
        title: 'Season 1',
        isSpecialSeason: false,
        episodes: [
          {
            id: 6,
            episodeNumber: 1,
            seasonNumber: 1,
            title: 'Episode 1',
            releaseDate: '9999-02-20',
            isSpecialEpisode: false,
          },
        ],
      },
    ],
  },
];

const user: User = {
  id: 1,
  name: 'admin',
  slug: 'admin',
  admin: true,
  password: 'password',
  publicReviews: false,
};

describe('upcomingEpisode', () => {
  beforeAll(async () => {
    await runMigrations();
    await userRepository.create(user);
    await mediaItemRepository.createMany(mediaItems);

    for (const item of mediaItems) {
      listItemRepository.addItem({
        userId: user.id,
        watchlist: true,
        mediaItemId: item.id,
      });
    }
  });

  afterAll(clearDatabase);

  test('items, properties', async () => {
    const fetchedMediaItems = await mediaItemRepository.items({
      userId: 1,
    });

    const itemsById = _.keyBy(fetchedMediaItems, (item) => item.id);

    expect(itemsById[1].upcomingEpisode).toStrictEqual({
      ...upcomingEpisode,
      userRating: undefined,
      seenHistory: undefined,
      lastSeenAt: undefined,
      seen: false,
    });

    expect(itemsById[1].nextAiring).toBe(upcomingEpisode.releaseDate);
  });

  test('details, properties', async () => {
    const fetchedMediaItem = await mediaItemRepository.details({
      userId: 1,
      mediaItemId: 1,
    });

    expect(fetchedMediaItem.upcomingEpisode).toMatchObject({
      ...upcomingEpisode,
      userRating: undefined,
      seenHistory: undefined,
      lastSeenAt: undefined,
      seen: false,
    });

    expect(fetchedMediaItem.nextAiring).toBe(upcomingEpisode.releaseDate);
  });

  test('items, no upcoming episode', async () => {
    const fetchedMediaItems = await mediaItemRepository.items({
      userId: 1,
    });

    const itemsById = _.keyBy(fetchedMediaItems, (item) => item.id);

    [2, 3, 4, 5, 6].map((mediaItemId) => {
      expect(itemsById[mediaItemId].upcomingEpisode).toStrictEqual(undefined);
    });
  });

  test('details, no upcoming episode', async () => {
    await Promise.all(
      [2, 3, 4, 5, 6].map(async (mediaItemId) => {
        const itemDetails = await mediaItemRepository.details({
          userId: 1,
          mediaItemId: mediaItemId,
        });

        expect(itemDetails.upcomingEpisode).toStrictEqual(undefined);
      })
    );
  });

  test('items', async () => {
    const fetchedMediaItems = await mediaItemRepository.items({
      userId: 1,
    });

    const itemsById = _.keyBy(fetchedMediaItems, (item) => item.id);

    expect(itemsById[7].upcomingEpisode).toBeDefined();
  });

  test('details', async () => {
    const fetchedMediaItem = await mediaItemRepository.details({
      userId: 1,
      mediaItemId: 7,
    });

    expect(fetchedMediaItem.upcomingEpisode).toBeDefined();
  });
});
