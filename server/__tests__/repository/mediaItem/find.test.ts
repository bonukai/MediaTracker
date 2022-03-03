import _ from 'lodash';

import { knex } from 'src/dbconfig';
import { tvEpisodeRepository } from 'src/repository/episode';
import { tvSeasonRepository } from 'src/repository/season';
import { clearDatabase, runMigrations } from '../../__utils__/utils';

const mediaItem = {
  id: 0,
  title: 'title',
  mediaType: 'tv',
  source: 'user',
};

const seasons = [
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
    deletedAt: new Date().getTime(),
  },
];

const episodes = [
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
    deletedAt: new Date().getTime(),
  },
];

describe('unlockLockedMediaItems.test', () => {
  beforeAll(async () => {
    await runMigrations();

    await knex('mediaItem').insert(mediaItem);
    await knex('season').insert(seasons);
    await knex('episode').insert(episodes);
  });

  afterAll(clearDatabase);

  test('should find only one item', async () => {
    const [res] = await tvSeasonRepository.find({});
    expect(res).toMatchObject(seasons[0]);

    const [res2] = await tvSeasonRepository.find({}, false);
    expect(res2).toMatchObject(seasons[0]);
  });

  test('should include soft deleted items', async () => {
    const res = await tvSeasonRepository.find({}, true);
    expect(res).toMatchObject(seasons);

    const res2 = await tvEpisodeRepository.find({}, true);
    expect(res2).toMatchObject(episodes);
  });
});
