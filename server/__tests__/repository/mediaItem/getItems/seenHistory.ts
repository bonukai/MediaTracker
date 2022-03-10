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
    id: 1,
    date: 1643313376841,
    mediaItemId: 1,
    userId: user.id,
    episodeId: 1,
    type: 'seen',
  },
  {
    id: 2,
    date: 1643313376842,
    mediaItemId: 1,
    userId: user.id,
    episodeId: 2,
    type: 'seen',
  },
  {
    id: 3,
    date: 1643313376843,
    mediaItemId: 1,
    userId: user.id,
    episodeId: 3,
    type: 'seen',
  },
  {
    id: 4,
    date: 1643313376844,
    mediaItemId: 3,
    episodeId: null,
    userId: user.id,
    type: 'seen',
  },
  {
    id: 5,
    date: 1643313376845,
    mediaItemId: 4,
    episodeId: 5,
    userId: user.id,
    type: 'seen',
  },
  {
    id: 6,
    date: 1643313376846,
    mediaItemId: 5,
    episodeId: 7,
    userId: 2,
    type: 'seen',
  },
  {
    id: 7,
    date: 1643313376847,
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

describe('seenHistory', () => {
  beforeAll(async () => {
    await runMigrations();
    await userRepository.create(user);
    await userRepository.create(user2);
    await mediaItemRepository.createMany(mediaItem);
    await seenRepository.createMany(seenEpisodes);
  });

  afterAll(clearDatabase);

  test('items, user', async () => {
    const fetchedMediaItems = await mediaItemRepository.items({
      userId: user.id,
    });

    fetchedMediaItems.forEach((item) => {
      expect(item.seenHistory).toBeUndefined();
    });
  });

  test('items, user2', async () => {
    const fetchedMediaItems = await mediaItemRepository.items({
      userId: user2.id,
    });

    fetchedMediaItems.forEach((item) => {
      expect(item.seenHistory).toBeUndefined();
    });
  });

  test('details, user', async () => {
    await Promise.all(
      _.map(
        {
          1: [seenEpisodes[0], seenEpisodes[1], seenEpisodes[2]],
          2: [],
          3: [seenEpisodes[3]],
          4: [seenEpisodes[4]],
          5: [],
        },
        async (value, mediaItemId) => {
          const details = await mediaItemRepository.details({
            mediaItemId: Number(mediaItemId),
            userId: user.id,
          });

          expect(details.seenHistory).toMatchObject(
            _.orderBy(value, (item) => item.date, 'desc')
          );
        }
      )
    );
  });

  test('details, user2', async () => {
    await Promise.all(
      _.map(
        {
          1: [],
          2: [],
          3: [],
          4: [],
          5: [seenEpisodes[5], seenEpisodes[6]],
        },
        async (value, mediaItemId) => {
          const details = await mediaItemRepository.details({
            mediaItemId: Number(mediaItemId),
            userId: user2.id,
          });

          expect(details.seenHistory).toMatchObject(
            _.orderBy(value, (item) => item.date, 'desc')
          );
        }
      )
    );
  });
});
