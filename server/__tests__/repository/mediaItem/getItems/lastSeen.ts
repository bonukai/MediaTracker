import _ from 'lodash';

import { mediaItemRepository } from 'src/repository/mediaItem';
import { MediaItemBaseWithSeasons } from 'src/entity/mediaItem';
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
    date: new Date(2021, 1, 1).getTime(),
    mediaItemId: 1,
    userId: user.id,
    episodeId: 1,
    type: 'seen',
  },
  {
    date: new Date(2021, 1, 2).getTime(),
    mediaItemId: 1,
    userId: user.id,
    episodeId: 2,
    type: 'seen',
  },
  {
    date: new Date(2021, 1, 3).getTime(),
    mediaItemId: 1,
    userId: user.id,
    episodeId: 3,
    type: 'seen',
  },
  {
    date: new Date(2021, 1, 4).getTime(),
    mediaItemId: 3,
    userId: user.id,
    type: 'seen',
  },
  {
    date: new Date(2021, 1, 5).getTime(),
    mediaItemId: 3,
    userId: user.id,
    type: 'seen',
  },
  {
    date: new Date(2021, 1, 6).getTime(),
    mediaItemId: 4,
    episodeId: 5,
    userId: user.id,
    type: 'seen',
  },
  {
    date: new Date(2021, 1, 7).getTime(),
    mediaItemId: 5,
    episodeId: 7,
    userId: 2,
    type: 'seen',
  },
  {
    date: new Date(2021, 1, 8).getTime(),
    mediaItemId: 5,
    episodeId: 8,
    userId: 2,
    type: 'seen',
  },
];

const mediaItem: MediaItemBaseWithSeasons[] = [
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
        isSpecialSeason: false,
        title: 'Season 1',
        episodes: [
          {
            id: 1,
            episodeNumber: 1,
            seasonId: 1,
            isSpecialEpisode: false,
            seasonNumber: 1,
            title: 'Episode 1',
            releaseDate: '2001-02-20',
          },
          {
            id: 2,
            episodeNumber: 2,
            isSpecialEpisode: false,
            seasonId: 1,
            seasonNumber: 1,
            title: 'Episode 2',
            releaseDate: '2001-02-21',
          },
        ],
      },
      {
        id: 2,
        seasonNumber: 2,
        isSpecialSeason: false,
        numberOfEpisodes: 2,
        title: 'Season 2',
        tvShowId: 1,
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
    title: 'title2',
    slug: 'title2',
  },
  {
    id: 3,
    lastTimeUpdated: new Date().getTime(),
    mediaType: 'movie',
    source: 'user',
    title: 'title3',
    slug: 'title3',
  },
  {
    id: 4,
    lastTimeUpdated: new Date().getTime(),
    mediaType: 'tv',
    source: 'user',
    title: 'title4',
    slug: 'title4',
    seasons: [
      {
        id: 3,
        seasonNumber: 1,
        numberOfEpisodes: 2,
        isSpecialSeason: false,
        title: 'Season 1',
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
    title: 'title5',
    slug: 'title5',
    seasons: [
      {
        id: 4,
        seasonNumber: 1,
        numberOfEpisodes: 2,
        isSpecialSeason: false,
        title: 'Season 1',
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

const lastSeenUser1: Record<number, number | null> = {
  1: seenEpisodes[2].date,
  2: null,
  3: seenEpisodes[4].date,
  4: seenEpisodes[5].date,
  5: null,
};

const lastSeenUser2: Record<number, number | null> = {
  1: null,
  2: null,
  3: null,
  4: null,
  5: seenEpisodes[7].date,
};

describe('lastSeen', () => {
  beforeAll(async () => {
    await runMigrations();
    await mediaItemRepository.createMany(mediaItem);
    await userRepository.create(user);
    await userRepository.create(user2);
    await seenRepository.createMany(seenEpisodes);
  });

  afterAll(clearDatabase);

  test('items, user', async () => {
    const fetchedMediaItems = await mediaItemRepository.items({
      userId: user.id,
    });

    const items = _.keyBy(fetchedMediaItems, (item) => item.id);

    Object.entries(lastSeenUser1)
      .filter(([mediaItemId, lastSeenAt]) => lastSeenAt)
      .forEach(([mediaItemId, lastSeenAt]) =>
        expect(items[mediaItemId].lastSeenAt).toStrictEqual(lastSeenAt)
      );
  });

  test('items, user2', async () => {
    const fetchedMediaItems = await mediaItemRepository.items({
      userId: user2.id,
    });

    const items = _.keyBy(fetchedMediaItems, (item) => item.id);

    Object.entries(lastSeenUser2)
      .filter(([mediaItemId, lastSeenAt]) => lastSeenAt)
      .forEach(([mediaItemId, lastSeenAt]) =>
        expect(items[mediaItemId].lastSeenAt).toStrictEqual(lastSeenAt)
      );
  });

  test('details, user', async () => {
    await Promise.all(
      Object.entries(lastSeenUser1).map(async ([mediaItemId, lastSeenAt]) => {
        const details = await mediaItemRepository.details({
          mediaItemId: Number(mediaItemId),
          userId: user.id,
        });

        expect(details.lastSeenAt).toStrictEqual(lastSeenAt);
      })
    );
  });

  test('details, user2', async () => {
    await Promise.all(
      Object.entries(lastSeenUser2).map(async ([mediaItemId, lastSeenAt]) => {
        const details = await mediaItemRepository.details({
          mediaItemId: Number(mediaItemId),
          userId: user2.id,
        });

        expect(details.lastSeenAt).toStrictEqual(lastSeenAt);
      })
    );
  });
});
