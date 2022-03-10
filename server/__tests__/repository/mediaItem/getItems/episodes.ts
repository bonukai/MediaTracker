import _ from 'lodash';

import { mediaItemRepository } from 'src/repository/mediaItem';
import { MediaItemBaseWithSeasons } from 'src/entity/mediaItem';
import { User } from 'src/entity/user';
import { userRepository } from 'src/repository/user';
import { clearDatabase, runMigrations } from '../../../__utils__/utils';

const user: User = {
  id: 1,
  name: 'admin',
  slug: 'admin',
  admin: true,
  password: 'password',
  publicReviews: false,
};

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
        isSpecialSeason: false,
        seasonNumber: 1,
        numberOfEpisodes: 2,
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
            seasonId: 1,
            seasonNumber: 1,
            isSpecialEpisode: false,
            title: 'Episode 2',
            releaseDate: '2001-02-21',
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
            isSpecialEpisode: false,
            episodeNumber: 1,
            seasonId: 2,
            seasonNumber: 2,
            title: 'Episode 1',
            releaseDate: '2002-02-20',
          },
        ],
      },
      {
        id: 3,
        seasonNumber: 3,
        isSpecialSeason: false,
        numberOfEpisodes: 0,
        title: 'Season 3',
        tvShowId: 1,
      },
    ],
  },
];

describe('episodes', () => {
  beforeAll(async () => {
    await runMigrations();
    await userRepository.create(user);
    await mediaItemRepository.createMany(mediaItem);
  });

  afterAll(clearDatabase);

  test('season without episodes', async () => {
    const mediaItem = await mediaItemRepository.details({
      mediaItemId: 1,
      userId: user.id,
    });

    expect(mediaItem.seasons).toHaveLength(3);
    expect(Array.isArray(mediaItem.seasons[2].episodes)).toBe(true);
  });
});
