import { Database } from 'src/dbconfig';

const mediaItem = {
  id: 1,
  lastTimeUpdated: new Date().getTime(),
  mediaType: 'movie',
  source: 'tmdb',
  title: 'movie',
  releaseDate: '2022-07-01',
};

const mediaItem2 = {
  id: 2,
  lastTimeUpdated: new Date().getTime(),
  mediaType: 'movie',
  source: 'tmdb',
  title: 'movie2',
  releaseDate: '2022-08-01T00:00:00.000Z',
};

const mediaItem3 = {
  id: 3,
  lastTimeUpdated: new Date().getTime(),
  mediaType: 'movie',
  source: 'tmdb',
  title: 'movie3',
  releaseDate: '2022-08-01',
};

const mediaItem4 = {
  id: 4,
  lastTimeUpdated: new Date().getTime(),
  mediaType: 'movie',
  source: 'tmdb',
  title: 'movie4',
  releaseDate: '2022-08-01',
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
  title: 'Episode 2',
  episodeNumber: 1,
  seasonNumber: 2,
  seasonAndEpisodeNumber: 1002,
  releaseDate: mediaItem2.releaseDate,
};

const episode3 = {
  id: 3,
  tvShowId: mediaItem.id,
  seasonId: season.id,
  isSpecialEpisode: false,
  title: 'Episode 3',
  episodeNumber: 3,
  seasonNumber: 2,
  seasonAndEpisodeNumber: 1003,
  releaseDate: '2022-08-01',
};

const episode4 = {
  id: 4,
  tvShowId: mediaItem.id,
  seasonId: season.id,
  isSpecialEpisode: false,
  title: 'Episode 4',
  episodeNumber: 4,
  seasonNumber: 2,
  seasonAndEpisodeNumber: 1004,
  releaseDate: '2022-08-01',
};

export const fillDatabase = async () => {
  await Database.knex('mediaItem').insert(mediaItem);
  await Database.knex('mediaItem').insert(mediaItem2);
  await Database.knex('mediaItem').insert(mediaItem3);
  await Database.knex('mediaItem').insert(mediaItem4);
  await Database.knex('season').insert(season);
  await Database.knex('episode').insert(episode);
  await Database.knex('episode').insert(episode2);
  await Database.knex('episode').insert(episode3);
  await Database.knex('episode').insert(episode4);
};
