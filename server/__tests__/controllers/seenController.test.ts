import { SeenController } from 'src/controllers/seen';
import { Database } from 'src/dbconfig';
import { Data } from '__tests__/__utils__/data';
import { request } from '__tests__/__utils__/request';
import { clearDatabase, runMigrations } from '__tests__/__utils__/utils';

describe('Seen controller', () => {
  beforeAll(async () => {
    await runMigrations();

    await Database.knex('user').insert(Data.user);
    await Database.knex('mediaItem').insert(Data.movie);
    await Database.knex('mediaItem').insert(Data.tvShow);
    await Database.knex('season').insert(Data.season);
    await Database.knex('episode').insert(Data.episode);
    await Database.knex('episode').insert(Data.episode2);
    await Database.knex('episode').insert(Data.episode3);
  });

  afterAll(clearDatabase);

  test('mediaItem - unknown date should be set as NULL', async () => {
    const seenController = new SeenController();

    await request(seenController.add, {
      userId: Data.user.id,
      requestQuery: {
        mediaItemId: Data.movie.id,
      },
    });

    const res = await Database.knex('seen')
      .where('mediaItemId', Data.movie.id)
      .where('userId', Data.user.id)
      .whereNull('episodeId')
      .first();

    expect(res.date).toBeNull();

    await Database.knex('seen').delete();
  });

  test('tvShow - unknown date should be set as NULL', async () => {
    const seenController = new SeenController();

    await request(seenController.add, {
      userId: Data.user.id,
      requestQuery: {
        mediaItemId: Data.tvShow.id,
      },
    });

    const res = await Database.knex('seen')
      .where('mediaItemId', Data.tvShow.id)
      .where('userId', Data.user.id)
      .whereNotNull('episodeId');

    expect(res.length).toBe(3);
    expect(res.map((value) => value.date)).toEqual(
      new Array(res.length).fill(null)
    );

    await Database.knex('seen').delete();
  });

  test('episode - unknown date should be set as NULL', async () => {
    const seenController = new SeenController();

    await request(seenController.add, {
      userId: Data.user.id,
      requestQuery: {
        mediaItemId: Data.tvShow.id,
        episodeId: Data.episode.id,
      },
    });

    const res = await Database.knex('seen')
      .where('mediaItemId', Data.tvShow.id)
      .where('userId', Data.user.id)
      .where('episodeId', Data.episode.id)
      .first();

    expect(res.date).toBeNull();

    await Database.knex('seen').delete();
  });

  test('lastSeenEpisode - unknown date should be set as NULL', async () => {
    const seenController = new SeenController();

    await request(seenController.add, {
      userId: Data.user.id,
      requestQuery: {
        mediaItemId: Data.tvShow.id,
        lastSeenEpisodeId: Data.episode2.id,
      },
    });

    const res = await Database.knex('seen')
      .where('mediaItemId', Data.tvShow.id)
      .where('userId', Data.user.id)
      .whereNotNull('episodeId');

    expect(res.length).toBe(2);
    expect(res.map((value) => value.date)).toEqual(
      new Array(res.length).fill(null)
    );
    await Database.knex('seen').delete();
  });

  test('date older then current date should not be allowed', async () => {
    const seenController = new SeenController();

    const res = await request(seenController.add, {
      userId: Data.user.id,
      requestQuery: {
        mediaItemId: Data.movie.id,
        date: new Date().getTime() + 3600000 * 2,
      },
    });

    expect(res.statusCode).toEqual(400);
  });

  test('date earlier then current date should be allowed', async () => {
    const seenController = new SeenController();

    const res = await request(seenController.add, {
      userId: Data.user.id,
      requestQuery: {
        mediaItemId: Data.movie.id,
        date: new Date().getTime() - 3600000,
      },
    });

    expect(res.statusCode).toEqual(200);
  });
});
