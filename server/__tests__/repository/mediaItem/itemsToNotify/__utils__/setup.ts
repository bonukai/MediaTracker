import { Database } from 'src/dbconfig';

const mediaItem = {
  id: 1,
  lastTimeUpdated: new Date().getTime(),
  mediaType: 'movie',
  source: 'tmdb',
  title: 'movie',
  slug: 'movie',
  releaseDate: '2022-07-01',
};

const mediaItem2 = {
  id: 2,
  lastTimeUpdated: new Date().getTime(),
  mediaType: 'movie',
  source: 'tmdb',
  title: 'movie2',
  slug: 'movie2',
  releaseDate: '2022-08-01T00:00:00.000Z',
};

const season = {
  id: 1,
  tvShowId: mediaItem.id,
  isSpecialSeason: false,
  title: 'Season 1',
  releaseDate: '2022-07-01',
  seasonNumber: 1,
  numberOfEpisodes: 2,
};

const episode = {
  id: 1,
  tvShowId: mediaItem.id,
  seasonId: season.id,
  isSpecialEpisode: false,
  title: 'Episode 1',
  episodeNumber: 1,
  seasonNumber: 1,
  seasonAndEpisodeNumber: 1001,
  releaseDate: mediaItem.releaseDate,
};

const episode2 = {
  id: 2,
  tvShowId: mediaItem.id,
  seasonId: season.id,
  isSpecialEpisode: false,
  title: 'Episode 1',
  episodeNumber: 1,
  seasonNumber: 2,
  seasonAndEpisodeNumber: 1002,
  releaseDate: mediaItem2.releaseDate,
};

export const fillDatabase = async () => {
  await Database.knex('mediaItem').insert(mediaItem);
  await Database.knex('mediaItem').insert(mediaItem2);
  await Database.knex('season').insert(season);
  await Database.knex('episode').insert(episode);
  await Database.knex('episode').insert(episode2);
};
