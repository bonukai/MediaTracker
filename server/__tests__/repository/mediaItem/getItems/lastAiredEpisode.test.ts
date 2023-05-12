import _ from 'lodash';

import { mediaItemRepository } from 'src/repository/mediaItem';
import { MediaItemBaseWithSeasons } from 'src/entity/mediaItem';
import { TvEpisode } from 'src/entity/tvepisode';
import { User } from 'src/entity/user';
import { Database } from 'src/dbconfig';
import { TvSeason } from 'src/entity/tvseason';
import { clearDatabase, runMigrations } from '../../../__utils__/utils';
import { listItemRepository } from 'src/repository/listItemRepository';
import { userRepository } from 'src/repository/user';

const lastAiredEpisode: TvEpisode = {
  id: 7,
  episodeNumber: 2,
  seasonId: 2,
  seasonNumber: 2,
  seasonAndEpisodeNumber: 2002,
  title: 'Episode 2',
  description: 'description',
  imdbId: 'imdbId',
  runtime: 29,
  tmdbId: 12345,
  releaseDate: '2022-03-01',
  tvShowId: 1,
  isSpecialEpisode: false,
};

const mediaItem: MediaItemBaseWithSeasons = {
  id: 1,
  lastTimeUpdated: new Date().getTime(),
  mediaType: 'tv',
  source: 'user',
  title: 'title',
  slug: 'title',
};

const seasons: TvSeason[] = [
  {
    id: 0,
    seasonNumber: 0,
    numberOfEpisodes: 1,
    title: 'Specials',
    isSpecialSeason: true,
    tvShowId: mediaItem.id,
  },
  {
    id: 1,
    seasonNumber: 1,
    numberOfEpisodes: 2,
    title: 'Season 1',
    isSpecialSeason: false,
    tvShowId: mediaItem.id,
  },
  {
    id: 2,
    seasonNumber: 2,
    numberOfEpisodes: 2,
    title: 'Season 2',
    isSpecialSeason: false,
    tvShowId: mediaItem.id,
  },
];

const episodes: TvEpisode[] = [
  {
    id: 0,
    episodeNumber: 1,
    seasonNumber: 0,
    seasonAndEpisodeNumber: 1,
    title: 'Episode 1',
    releaseDate: '2022-03-02',
    isSpecialEpisode: true,
    tvShowId: mediaItem.id,
    seasonId: 0,
  },
  {
    id: 1,
    episodeNumber: 1,
    seasonNumber: 1,
    seasonAndEpisodeNumber: 1001,
    title: 'Episode 1',
    releaseDate: '2001-02-20',
    isSpecialEpisode: false,
    tvShowId: mediaItem.id,
    seasonId: 1,
  },
  {
    id: 2,
    episodeNumber: 2,
    seasonNumber: 1,
    seasonAndEpisodeNumber: 1002,
    title: 'Episode 2',
    releaseDate: '2001-02-21',
    isSpecialEpisode: false,
    tvShowId: mediaItem.id,
    seasonId: 2,
  },
  {
    id: 3,
    episodeNumber: 1,
    seasonNumber: 2,
    seasonAndEpisodeNumber: 2001,
    title: 'Episode 1',
    releaseDate: '2002-02-20',
    isSpecialEpisode: false,
    tvShowId: mediaItem.id,
    seasonId: 2,
  },
  lastAiredEpisode,
  {
    id: 8,
    episodeNumber: 3,
    seasonNumber: 2,
    seasonAndEpisodeNumber: 2003,
    title: 'Episode 3',
    releaseDate: '9999-01-01',
    isSpecialEpisode: false,
    tvShowId: mediaItem.id,
    seasonId: 2,
  },
];

const user: User = {
  id: 1,
  name: 'admin',
  admin: true,
  password: 'password',
  publicReviews: false,
};

describe('lastAiredEpisode', () => {
  beforeAll(async () => {
    await runMigrations();
    await Database.knex('mediaItem').insert(mediaItem);
    await Database.knex('season').insert(seasons);
    await Database.knex('episode').insert(episodes);

    await userRepository.create(user);

    await listItemRepository.addItem({
      watchlist: true,
      mediaItemId: mediaItem.id,
      userId: user.id,
    });
  });

  afterAll(clearDatabase);

  test('items', async () => {
    const [result] = await mediaItemRepository.items({
      userId: 1,
    });

    expect(result.lastAiredEpisode).toMatchObject(
      _.omit(lastAiredEpisode, 'seasonAndEpisodeNumber')
    );

    expect(result.lastAiring).toBe(lastAiredEpisode.releaseDate);
  });

  test('details', async () => {
    const result = await mediaItemRepository.details({
      userId: 1,
      mediaItemId: mediaItem.id,
    });

    expect(result.lastAiredEpisode).toMatchObject(
      _.omit(lastAiredEpisode, 'seasonAndEpisodeNumber')
    );

    expect(result.lastAiring).toBe(lastAiredEpisode.releaseDate);
  });
});
