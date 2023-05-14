import _ from 'lodash';
import { userStatisticsSummary } from 'src/controllers/statisticsController';
import { Database } from 'src/dbconfig';
import { clearDatabase, runMigrations } from '__tests__/__utils__/utils';

const tvShow = {
  id: 1,
  lastTimeUpdated: new Date().getTime(),
  mediaType: 'tv',
  source: 'user',
  title: 'title',
  runtime: 40,
};

const season = {
  id: 1,
  seasonNumber: 1,
  numberOfEpisodes: 2,
  title: 'Season 1',
  isSpecialSeason: false,
  tvShowId: tvShow.id,
};

const episode = {
  id: 1,
  episodeNumber: 1,
  seasonNumber: 1,
  seasonAndEpisodeNumber: 1001,
  title: 'Episode 1',
  releaseDate: '2001-02-20',
  isSpecialEpisode: false,
  tvShowId: tvShow.id,
  seasonId: season.id,
};

const episode2 = {
  id: 2,
  episodeNumber: 2,
  seasonNumber: 1,
  seasonAndEpisodeNumber: 1002,
  title: 'Episode 2',
  releaseDate: '2001-02-21',
  isSpecialEpisode: false,
  tvShowId: tvShow.id,
  seasonId: season.id,
  runtime: 44,
};

const movie = {
  id: 2,
  lastTimeUpdated: new Date().getTime(),
  mediaType: 'movie',
  source: 'user',
  title: 'title2',
  runtime: 120,
};

const book = {
  id: 3,
  lastTimeUpdated: new Date().getTime(),
  mediaType: 'book',
  source: 'user',
  title: 'title3',
  numberOfPages: 123,
};

const audiobook = {
  id: 4,
  lastTimeUpdated: new Date().getTime(),
  mediaType: 'audiobook',
  source: 'user',
  title: 'title4',
  runtime: 999,
};

const videoGame = {
  id: 5,
  lastTimeUpdated: new Date().getTime(),
  mediaType: 'video_game',
  source: 'user',
  title: 'title5',
};

const user = {
  id: 1,
  name: 'admin',
  admin: true,
  password: 'password',
  publicReviews: false,
};

const seen = {
  movie: {
    userId: user.id,
    mediaItemId: movie.id,
  },
  moviePlay2: {
    userId: user.id,
    mediaItemId: movie.id,
  },
  book: {
    userId: user.id,
    mediaItemId: book.id,
    duration: 12,
  },
  audiobook: {
    userId: user.id,
    mediaItemId: audiobook.id,
  },
  videoGame: {
    userId: user.id,
    mediaItemId: videoGame.id,
    duration: 123,
  },
  episode: {
    userId: user.id,
    mediaItemId: tvShow.id,
    episodeId: episode.id,
  },
  episode2: {
    userId: user.id,
    mediaItemId: tvShow.id,
    episodeId: episode2.id,
  },
};

const progress = {
  movie: {
    userId: user.id,
    mediaItemId: movie.id,
    progress: 0.2,
    date: Date.now(),
  },
  book: {
    userId: user.id,
    mediaItemId: book.id,
    duration: 55,
    progress: 0.3,
    date: Date.now(),
  },
  audiobook: {
    userId: user.id,
    mediaItemId: audiobook.id,
    progress: 0.4,
    date: Date.now(),
  },
  videoGame: {
    userId: user.id,
    mediaItemId: videoGame.id,
    duration: 456,
    progress: 0.5,
    date: Date.now(),
  },
  episode: {
    userId: user.id,
    mediaItemId: tvShow.id,
    episodeId: episode.id,
    progress: 0.6,
    date: Date.now(),
  },
  episode2: {
    userId: user.id,
    mediaItemId: tvShow.id,
    episodeId: episode2.id,
    progress: 0.7,
    date: Date.now(),
  },
};

describe('statistics summary', () => {
  beforeAll(async () => {
    await runMigrations();
    await Database.knex('user').insert(user);

    await Database.knex('mediaItem').insert(tvShow);
    await Database.knex('season').insert(season);
    await Database.knex('episode').insert(episode);
    await Database.knex('episode').insert(episode2);

    await Database.knex('mediaItem').insert(movie);
    await Database.knex('mediaItem').insert(videoGame);
    await Database.knex('mediaItem').insert(book);
    await Database.knex('mediaItem').insert(audiobook);

    await Database.knex('seen').insert(Object.values(seen));
    await Database.knex('progress').insert(Object.values(progress));
  });

  afterAll(clearDatabase);

  test('should sum correctly', async () => {
    const res = await userStatisticsSummary(user.id);

    expect(res.audiobook.numberOfPages).toBe(0);
    expect(res.audiobook.episodes).toBe(0);
    expect(res.audiobook.items).toBe(1);
    expect(res.audiobook.plays).toBe(1);
    expect(res.audiobook.duration).toBe(Math.round(audiobook.runtime));

    expect(res.video_game.numberOfPages).toBe(0);
    expect(res.video_game.episodes).toBe(0);
    expect(res.video_game.items).toBe(1);
    expect(res.video_game.plays).toBe(1);
    expect(res.video_game.duration).toBe(Math.round(seen.videoGame.duration));

    expect(res.movie.numberOfPages).toBe(0);
    expect(res.movie.episodes).toBe(0);
    expect(res.movie.items).toBe(1);
    expect(res.movie.plays).toBe(2);
    expect(res.movie.duration).toBe(Math.round(movie.runtime * 2));

    expect(res.book.numberOfPages).toBe(Math.round(book.numberOfPages));
    expect(res.book.episodes).toBe(0);
    expect(res.book.items).toBe(1);
    expect(res.book.plays).toBe(1);
    expect(res.book.duration).toBe(Math.round(seen.book.duration));

    expect(res.tv.numberOfPages).toBe(0);
    expect(res.tv.episodes).toBe(2);
    expect(res.tv.items).toBe(1);
    expect(res.tv.plays).toBe(2);
    expect(res.tv.duration).toBe(Math.round(episode2.runtime + tvShow.runtime));
  });
});
