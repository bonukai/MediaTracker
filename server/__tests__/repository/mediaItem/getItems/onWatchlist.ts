import _ from 'lodash';

import { mediaItemRepository } from 'src/repository/mediaItem';
import { MediaItemBaseWithSeasons } from 'src/entity/mediaItem';
import { User } from 'src/entity/user';
import { userRepository } from 'src/repository/user';
import { Watchlist } from 'src/entity/watchlist';
import { watchlistRepository } from 'src/repository/watchlist';
import { clearDatabase, runMigrations } from '../../../__utils__/utils';

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

const watchlist: Watchlist[] = [
  {
    mediaItemId: 1,
    userId: user.id,
  },
  {
    mediaItemId: 2,
    userId: user.id,
  },
  {
    mediaItemId: 3,
    userId: user.id,
  },
  {
    mediaItemId: 4,
    userId: user.id,
  },
  {
    mediaItemId: 5,
    userId: user.id,
  },
];

const mediaItem: MediaItemBaseWithSeasons[] = [
  {
    id: 1,
    lastTimeUpdated: new Date().getTime(),
    mediaType: 'tv',
    source: 'user',
    title: 'title',
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
            seasonId: 1,
            seasonNumber: 1,
            title: 'Episode 1',
            releaseDate: '2001-02-20',
            isSpecialEpisode: false,
          },
          {
            id: 2,
            episodeNumber: 2,
            seasonId: 1,
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
        tvShowId: 1,
        isSpecialSeason: false,
        episodes: [
          {
            id: 3,
            episodeNumber: 1,
            seasonId: 2,
            seasonNumber: 2,
            title: 'Episode 1',
            releaseDate: '2002-02-20',
            isSpecialEpisode: false,
          },
        ],
      },
    ],
  },
  {
    id: 2,
    lastTimeUpdated: new Date().getTime(),
    mediaType: 'tv',
    source: 'user',
    title: 'title',
  },
  {
    id: 3,
    lastTimeUpdated: new Date().getTime(),
    mediaType: 'movie',
    source: 'user',
    title: 'title',
  },
  {
    id: 4,
    lastTimeUpdated: new Date().getTime(),
    mediaType: 'tv',
    source: 'user',
    title: 'title',
    seasons: [
      {
        id: 3,
        seasonNumber: 1,
        numberOfEpisodes: 2,
        title: 'Season 1',
        isSpecialSeason: false,
        episodes: [
          {
            id: 5,
            episodeNumber: 1,
            seasonId: 3,
            seasonNumber: 1,
            title: 'Episode 1',
            releaseDate: '2001-02-20',
            isSpecialEpisode: false,
          },
          {
            id: 6,
            episodeNumber: 2,
            seasonId: 3,
            seasonNumber: 1,
            title: 'Episode 2',
            releaseDate: '9999-02-21',
            isSpecialEpisode: false,
          },
        ],
      },
    ],
  },
  {
    id: 5,
    lastTimeUpdated: new Date().getTime(),
    mediaType: 'tv',
    source: 'user',
    title: 'title',
    seasons: [
      {
        id: 4,
        seasonNumber: 1,
        numberOfEpisodes: 2,
        title: 'Season 1',
        isSpecialSeason: false,
        episodes: [
          {
            id: 7,
            episodeNumber: 1,
            seasonNumber: 1,
            title: 'Episode 1',
            releaseDate: '2001-02-20',
            isSpecialEpisode: false,
          },
          {
            id: 8,
            episodeNumber: 2,
            seasonNumber: 1,
            title: 'Episode 2',
            releaseDate: '2001-02-21',
            isSpecialEpisode: false,
          },
        ],
      },
    ],
  },
];

const onWatchlistUser1 = {
  1: true,
  2: true,
  3: true,
  4: true,
  5: true,
};

const onWatchlistUser2 = {
  1: false,
  2: false,
  3: false,
  4: false,
  5: false,
};

describe('onWatchlist', () => {
  beforeAll(async () => {
    await runMigrations();
    await userRepository.create(user);
    await userRepository.create(user2);
    await mediaItemRepository.createMany(mediaItem);
    await watchlistRepository.createMany(watchlist);
  });

  afterAll(clearDatabase);

  test('items, user', async () => {
    const fetchedMediaItems = await mediaItemRepository.items({
      userId: user.id,
    });

    const items = _.keyBy(fetchedMediaItems, (item) => item.id);

    Object.entries(onWatchlistUser1)
      .filter(([mediaItemId, onWatchlist]) => onWatchlist)
      .forEach(([mediaItemId, onWatchlist]) =>
        expect(items[mediaItemId].onWatchlist).toStrictEqual(onWatchlist)
      );
  });

  test('items, user2', async () => {
    const fetchedMediaItems = await mediaItemRepository.items({
      userId: user2.id,
    });

    const items = _.keyBy(fetchedMediaItems, (item) => item.id);

    Object.entries(onWatchlistUser2)
      .filter(([mediaItemId, onWatchlist]) => onWatchlist)
      .forEach(([mediaItemId, onWatchlist]) =>
        expect(items[mediaItemId].onWatchlist).toStrictEqual(onWatchlist)
      );
  });

  test('details, user', async () => {
    await Promise.all(
      Object.entries(onWatchlistUser1).map(
        async ([mediaItemId, onWatchlist]) => {
          const details = await mediaItemRepository.details({
            mediaItemId: Number(mediaItemId),
            userId: user.id,
          });

          expect(details.onWatchlist).toStrictEqual(onWatchlist);
        }
      )
    );
  });

  test('details, user2', async () => {
    await Promise.all(
      Object.entries(onWatchlistUser2).map(
        async ([mediaItemId, onWatchlist]) => {
          const details = await mediaItemRepository.details({
            mediaItemId: Number(mediaItemId),
            userId: user2.id,
          });

          expect(details.onWatchlist).toStrictEqual(onWatchlist);
        }
      )
    );
  });
});
