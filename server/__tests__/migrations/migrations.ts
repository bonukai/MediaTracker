import { milliseconds } from 'date-fns';

import { knex } from 'src/dbconfig';
import { MIGRATIONS_EXTENSION } from 'src/config';
import { migrationsDirectory } from 'src/knexfile';
import { clearDatabase, randomNumericId } from '../__utils__/utils';
import { InitialData } from '__tests__/__utils__/data';
import { Image } from 'src/entity/image';
import { Configuration } from 'src/entity/configuration';
import { MediaItemBase } from 'src/entity/mediaItem';
import { Watchlist } from 'src/entity/watchlist';
import { Seen } from 'src/entity/seen';
import { List, ListItem } from 'src/entity/list';
import { User } from 'src/entity/user';

describe('migrations', () => {
  beforeAll(async () => {
    await knex.migrate.rollback(
      {
        directory: migrationsDirectory,
      },
      true
    );

    await knex.migrate.up({
      name: `20210818142342_init.${MIGRATIONS_EXTENSION}`,
      directory: migrationsDirectory,
    });

    await knex('user').insert(InitialData.user);
    await knex('configuration').insert(InitialData.configuration);
    await knex('accessToken').insert(InitialData.accessToken);
    await knex('mediaItem').insert(InitialData.mediaItem);
    await knex('season').insert(InitialData.season);
    await knex('episode').insert(InitialData.episode);
    await knex('seen').insert(InitialData.seen);
    await knex('watchlist').insert(InitialData.watchlist);
    await knex('userRating').insert(InitialData.userRating);
    await knex('userRating').insert(InitialData.userRating2);
    await knex('userRating').insert(InitialData.userRating3);
    await knex('notificationsHistory').insert(InitialData.notificationsHistory);
    await knex('notificationPlatformsCredentials').insert(
      InitialData.notificationPlatformsCredentials
    );
  });

  test('20220121025651_ratingColumnFloat', async () => {
    await knex.migrate.up({
      name: `20220121025651_ratingColumnFloat.${MIGRATIONS_EXTENSION}`,
      directory: migrationsDirectory,
    });

    await knex.migrate.down({
      directory: migrationsDirectory,
    });

    await knex.migrate.up({
      name: `20220121025651_ratingColumnFloat.${MIGRATIONS_EXTENSION}`,
      directory: migrationsDirectory,
    });
  });

  test('20220122003141_bigIntToFloat', async () => {
    await knex.migrate.up({
      name: `20220122003141_bigIntToFloat.${MIGRATIONS_EXTENSION}`,
      directory: migrationsDirectory,
    });

    await knex.migrate.down({
      directory: migrationsDirectory,
    });

    await knex.migrate.up({
      name: `20220122003141_bigIntToFloat.${MIGRATIONS_EXTENSION}`,
      directory: migrationsDirectory,
    });
  });

  test('20220127224112_configuration', async () => {
    await knex.migrate.up({
      name: `20220127224112_configuration.${MIGRATIONS_EXTENSION}`,
      directory: migrationsDirectory,
    });

    await knex<Configuration>('configuration').update({
      audibleLang: 'us',
      serverLang: 'en',
      tmdbLang: 'en',
    });

    await knex.migrate.down({
      directory: migrationsDirectory,
    });

    await knex.migrate.up({
      name: `20220127224112_configuration.${MIGRATIONS_EXTENSION}`,
      directory: migrationsDirectory,
    });
  });

  test('20220202231058_image', async () => {
    await knex.migrate.up({
      name: `20220202231058_image.${MIGRATIONS_EXTENSION}`,
      directory: migrationsDirectory,
    });

    await knex<Image>('image').insert({
      id: '1',
      mediaItemId: InitialData.mediaItem.id,
      type: 'poster',
    });

    await knex<Image>('image').insert({
      id: '2',
      mediaItemId: InitialData.season.tvShowId,
      seasonId: InitialData.season.id,
      type: 'backdrop',
    });

    await knex.migrate.down({
      directory: migrationsDirectory,
    });

    await knex.migrate.up({
      name: `20220202231058_image.${MIGRATIONS_EXTENSION}`,
      directory: migrationsDirectory,
    });
  });

  test('20220208203349_traktId_goodreadsId', async () => {
    await knex.migrate.up({
      name: `20220208203349_traktId_goodreadsId.${MIGRATIONS_EXTENSION}`,
      directory: migrationsDirectory,
    });

    await knex<MediaItemBase>('mediaItem').insert({
      id: 999,
      title: 'title',
      source: 'user',
      traktId: 123456,
      goodreadsId: 987654,
    });

    await knex.migrate.down({
      directory: migrationsDirectory,
    });

    await knex.migrate.up({
      name: `20220208203349_traktId_goodreadsId.${MIGRATIONS_EXTENSION}`,
      directory: migrationsDirectory,
    });
  });

  test('20220208230635_numberOfPages', async () => {
    await knex.migrate.up({
      name: `20220208230635_numberOfPages.${MIGRATIONS_EXTENSION}`,
      directory: migrationsDirectory,
    });

    await knex<MediaItemBase>('mediaItem').insert({
      id: 777,
      title: 'title',
      source: 'user',
      numberOfPages: 111,
    });

    await knex.migrate.down({
      directory: migrationsDirectory,
    });

    await knex.migrate.up({
      name: `20220208230635_numberOfPages.${MIGRATIONS_EXTENSION}`,
      directory: migrationsDirectory,
    });
  });

  test('20220208234441_watchlist', async () => {
    await knex.migrate.up({
      name: `20220208234441_watchlist.${MIGRATIONS_EXTENSION}`,
      directory: migrationsDirectory,
    });

    const watchlist: Watchlist = {
      id: 777,
      userId: 1,
      mediaItemId: 1,
      addedAt: new Date().getTime(),
    };

    await knex<Watchlist>('watchlist').insert(watchlist);

    expect(await knex('watchlist').where('id', watchlist.id).first()).toEqual(
      watchlist
    );

    await knex.migrate.down({
      directory: migrationsDirectory,
    });

    await knex.migrate.up({
      name: `20220208234441_watchlist.${MIGRATIONS_EXTENSION}`,
      directory: migrationsDirectory,
    });
  });

  test('20220209000937_seen', async () => {
    const mediaItem = {
      id: randomNumericId(),
      title: 'title',
      source: 'user',
      runtime: 121,
    };

    const show = {
      id: randomNumericId(),
      title: 'title',
      source: 'user',
      runtime: 42,
    };

    const season = {
      id: randomNumericId(),
      title: 'Season 1',
      isSpecialSeason: false,
      seasonNumber: 1,
      tvShowId: show.id,
      numberOfEpisodes: 1,
    };

    const episodeWithRuntime = {
      id: randomNumericId(),
      title: 'Episode 1',
      seasonNumber: 1,
      episodeNumber: 1,
      isSpecialEpisode: false,
      runtime: 31,
      tvShowId: show.id,
      seasonId: season.id,
      seasonAndEpisodeNumber: 1001,
    };

    const episodeWithoutRuntime = {
      id: randomNumericId(),
      title: 'Episode 2',
      seasonNumber: 1,
      episodeNumber: 2,
      isSpecialEpisode: false,
      tvShowId: show.id,
      seasonId: season.id,
      seasonAndEpisodeNumber: 1002,
    };

    const seenMediaItem = {
      id: randomNumericId(),
      userId: 1,
      mediaItemId: mediaItem.id,
    };

    const seenEpisodeWithRuntime = {
      id: randomNumericId(),
      userId: 1,
      mediaItemId: show.id,
      episodeId: episodeWithRuntime.id,
    };

    const seenEpisodeWithoutRuntime = {
      id: randomNumericId(),
      userId: 1,
      mediaItemId: show.id,
      episodeId: episodeWithoutRuntime.id,
    };

    await knex('mediaItem').insert(mediaItem);
    await knex('mediaItem').insert(show);
    await knex('season').insert(season);
    await knex('episode').insert(episodeWithRuntime);
    await knex('episode').insert(episodeWithoutRuntime);
    await knex('seen').insert(seenMediaItem);
    await knex('seen').insert(seenEpisodeWithRuntime);
    await knex('seen').insert(seenEpisodeWithoutRuntime);

    await knex.migrate.up({
      name: `20220209000937_seen.${MIGRATIONS_EXTENSION}`,
      directory: migrationsDirectory,
    });

    expect(
      (await knex('seen').where('id', seenEpisodeWithRuntime.id).first())
        .duration
    ).toEqual(episodeWithRuntime.runtime * 60 * 1000);

    expect(
      (await knex('seen').where('id', seenEpisodeWithoutRuntime.id).first())
        .duration
    ).toEqual(show.runtime * 60 * 1000);

    expect(
      (await knex('seen').where('id', seenMediaItem.id).first()).duration
    ).toEqual(mediaItem.runtime * 60 * 1000);

    const seen = {
      id: randomNumericId(),
      userId: 1,
      mediaItemId: 1,
      startedAt: new Date().getTime(),
      duration: milliseconds({
        hours: 1,
        minutes: 10,
        seconds: 12,
      }),
      action: 'watched',
      date: new Date().getTime(),
      progress: 0.2,
    };

    await knex('seen').insert(seen);

    await knex.migrate.down({
      directory: migrationsDirectory,
    });

    await knex.migrate.up({
      name: `20220209000937_seen.${MIGRATIONS_EXTENSION}`,
      directory: migrationsDirectory,
    });

    await knex('seen').where('id', seen.id).delete();
    await knex('seen').insert(seen);
  });

  test('20220209005700_list', async () => {
    await knex.migrate.up({
      name: `20220209005700_list.${MIGRATIONS_EXTENSION}`,
      directory: migrationsDirectory,
    });

    const list = {
      id: 1,
      name: 'list',
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
      userId: 1,
      description: 'description',
      privacy: 'private',
    };

    const listItem = {
      addedAt: new Date().getTime(),
      listId: 1,
      mediaItemId: 1,
    };

    await knex('list').insert(list);
    await knex('listItem').insert(listItem);

    await knex.migrate.down({
      directory: migrationsDirectory,
    });

    await knex.migrate.up({
      name: `20220209005700_list.${MIGRATIONS_EXTENSION}`,
      directory: migrationsDirectory,
    });

    await knex('list').insert(list);
    await knex('listItem').insert(listItem);
  });

  test('20220209014700_userPreferences', async () => {
    await knex.migrate.up({
      name: `20220209014700_userPreferences.${MIGRATIONS_EXTENSION}`,
      directory: migrationsDirectory,
    });

    const user = {
      id: randomNumericId(),
      name: 'name',
      password: 'password',
      clientPreferences: {
        hideEpisodeTitleForUnseenEpisodes: true,
        hideOverviewForUnseenSeasons: true,
      },
    };

    await knex('user').insert(user);

    await knex.migrate.down({
      directory: migrationsDirectory,
    });

    await knex.migrate.up({
      name: `20220209014700_userPreferences.${MIGRATIONS_EXTENSION}`,
      directory: migrationsDirectory,
    });

    await knex('user').where('id', user.id).delete();
    await knex('user').insert(user);
  });

  test('20220209034100_userPreferences', async () => {
    await knex.migrate.up({
      name: `20220209034100_userPreferences.${MIGRATIONS_EXTENSION}`,
      directory: migrationsDirectory,
    });

    const user = {
      id: randomNumericId(),
      name: 'name',
      password: 'password',
      hideEpisodeTitleForUnseenEpisodes: true,
      hideOverviewForUnseenSeasons: true,
    };

    await knex('user').insert(user);

    await knex.migrate.down({
      directory: migrationsDirectory,
    });

    await knex.migrate.up({
      name: `20220209034100_userPreferences.${MIGRATIONS_EXTENSION}`,
      directory: migrationsDirectory,
    });

    await knex('user').where('id', user.id).delete();
    await knex('user').insert(user);
  });

  test('20220217012900_progress', async () => {
    const seen = {
      id: randomNumericId(),
      userId: InitialData.user.id,
      mediaItemId: InitialData.mediaItem.id,
      date: new Date().getTime(),
      action: 'started',
    };

    const seen2 = {
      id: randomNumericId(),
      userId: InitialData.user.id,
      mediaItemId: InitialData.mediaItem.id,
      episodeId: InitialData.episode.id,
      date: new Date().getTime(),
      action: 'started',
    };

    await knex('seen').insert(seen);
    await knex('seen').insert(seen2);

    await knex.migrate.up({
      name: `20220217012900_progress.${MIGRATIONS_EXTENSION}`,
      directory: migrationsDirectory,
    });

    const progress = await knex('seen')
      .where('type', 'progress')
      .where('mediaItemId', seen.mediaItemId)
      .whereNull('episodeId')
      .first();

    const progress2 = await knex('seen')
      .where('type', 'progress')
      .where('mediaItemId', seen2.mediaItemId)
      .where('episodeId', seen2.episodeId)
      .first();

    expect(progress).toMatchObject({
      userId: seen.userId,
      progress: 0,
      date: seen.date,
    });

    expect(progress2).toMatchObject({
      userId: seen.userId,
      progress: 0,
      date: seen.date,
    });

    await knex.migrate.down({
      directory: migrationsDirectory,
    });

    await knex.migrate.up({
      name: `20220217012900_progress.${MIGRATIONS_EXTENSION}`,
      directory: migrationsDirectory,
    });

    await knex('seen').insert({
      userId: InitialData.user.id,
      mediaItemId: InitialData.mediaItem.id,
      progress: 0.1,
      duration: 123,
      date: new Date().getTime(),
      type: 'progress',
    });
  });

  afterAll(clearDatabase);
});
