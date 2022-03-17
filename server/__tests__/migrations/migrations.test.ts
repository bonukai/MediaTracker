import { milliseconds } from 'date-fns';

import { Config } from 'src/config';
import { clearDatabase, randomNumericId } from '../__utils__/utils';
import { InitialData } from '__tests__/__utils__/data';
import { Image } from 'src/entity/image';
import { Configuration } from 'src/entity/configuration';
import { MediaItemBase } from 'src/entity/mediaItem';
import { Watchlist } from 'src/entity/watchlist';
import { Database } from 'src/dbconfig';
import { randomSlugId, toSlug } from 'src/slug';
import { nanoid } from 'nanoid';

describe('migrations', () => {
  beforeAll(async () => {
    Database.init();
    await Database.knex.migrate.rollback(
      {
        directory: Config.MIGRATIONS_DIRECTORY,
      },
      true
    );

    await Database.knex.migrate.up({
      name: `20210818142342_init.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex('user').insert(InitialData.user);
    await Database.knex('configuration').insert(InitialData.configuration);
    await Database.knex('accessToken').insert(InitialData.accessToken);
    await Database.knex('mediaItem').insert(InitialData.mediaItem);
    await Database.knex('season').insert(InitialData.season);
    await Database.knex('episode').insert(InitialData.episode);
    await Database.knex('seen').insert(InitialData.seen);
    await Database.knex('watchlist').insert(InitialData.watchlist);
    await Database.knex('userRating').insert(InitialData.userRating);
    await Database.knex('userRating').insert(InitialData.userRating2);
    await Database.knex('userRating').insert(InitialData.userRating3);
    await Database.knex('notificationsHistory').insert(
      InitialData.notificationsHistory
    );
    await Database.knex('notificationPlatformsCredentials').insert(
      InitialData.notificationPlatformsCredentials
    );
    await Database.knex('metadataProviderCredentials').insert(
      InitialData.metadataProviderCredentials
    );
    await Database.knex('metadataProviderCredentials').insert(
      InitialData.metadataProviderCredentials2
    );
  });

  test('20220121025651_ratingColumnFloat', async () => {
    await Database.knex.migrate.up({
      name: `20220121025651_ratingColumnFloat.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.down({
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.up({
      name: `20220121025651_ratingColumnFloat.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });
  });

  test('20220122003141_bigIntToFloat', async () => {
    await Database.knex.migrate.up({
      name: `20220122003141_bigIntToFloat.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.down({
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.up({
      name: `20220122003141_bigIntToFloat.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });
  });

  test('20220127224112_configuration', async () => {
    await Database.knex.migrate.up({
      name: `20220127224112_configuration.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex<Configuration>('configuration').update({
      audibleLang: 'us',
      serverLang: 'en',
      tmdbLang: 'en',
    });

    await Database.knex.migrate.down({
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.up({
      name: `20220127224112_configuration.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });
  });

  test('20220202231058_image', async () => {
    await Database.knex.migrate.up({
      name: `20220202231058_image.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex<Image>('image').insert({
      id: '1',
      mediaItemId: InitialData.mediaItem.id,
      type: 'poster',
    });

    await Database.knex<Image>('image').insert({
      id: '2',
      mediaItemId: InitialData.season.tvShowId,
      seasonId: InitialData.season.id,
      type: 'backdrop',
    });

    await Database.knex.migrate.down({
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.up({
      name: `20220202231058_image.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });
  });

  test('20220208203349_traktId_goodreadsId', async () => {
    await Database.knex.migrate.up({
      name: `20220208203349_traktId_goodreadsId.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex<MediaItemBase>('mediaItem').insert({
      id: 999,
      title: 'title',
      source: 'user',
      traktId: 123456,
      goodreadsId: 987654,
    });

    await Database.knex.migrate.down({
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.up({
      name: `20220208203349_traktId_goodreadsId.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });
  });

  test('20220208230635_numberOfPages', async () => {
    await Database.knex.migrate.up({
      name: `20220208230635_numberOfPages.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex<MediaItemBase>('mediaItem').insert({
      id: 777,
      title: 'title',
      source: 'user',
      numberOfPages: 111,
    });

    await Database.knex.migrate.down({
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.up({
      name: `20220208230635_numberOfPages.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });
  });

  test('20220208234441_watchlist', async () => {
    await Database.knex.migrate.up({
      name: `20220208234441_watchlist.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    const watchlist: Watchlist = {
      id: 777,
      userId: 1,
      mediaItemId: 1,
      addedAt: new Date().getTime(),
    };

    await Database.knex<Watchlist>('watchlist').insert(watchlist);

    expect(
      await Database.knex('watchlist').where('id', watchlist.id).first()
    ).toEqual(watchlist);

    await Database.knex.migrate.down({
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.up({
      name: `20220208234441_watchlist.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
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

    await Database.knex('mediaItem').insert(mediaItem);
    await Database.knex('mediaItem').insert(show);
    await Database.knex('season').insert(season);
    await Database.knex('episode').insert(episodeWithRuntime);
    await Database.knex('episode').insert(episodeWithoutRuntime);
    await Database.knex('seen').insert(seenMediaItem);
    await Database.knex('seen').insert(seenEpisodeWithRuntime);
    await Database.knex('seen').insert(seenEpisodeWithoutRuntime);

    await Database.knex.migrate.up({
      name: `20220209000937_seen.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    expect(
      (
        await Database.knex('seen')
          .where('id', seenEpisodeWithRuntime.id)
          .first()
      ).duration
    ).toEqual(episodeWithRuntime.runtime * 60 * 1000);

    expect(
      (
        await Database.knex('seen')
          .where('id', seenEpisodeWithoutRuntime.id)
          .first()
      ).duration
    ).toEqual(show.runtime * 60 * 1000);

    expect(
      (await Database.knex('seen').where('id', seenMediaItem.id).first())
        .duration
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

    await Database.knex('seen').insert(seen);

    await Database.knex.migrate.down({
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.up({
      name: `20220209000937_seen.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex('seen').where('id', seen.id).delete();
    await Database.knex('seen').insert(seen);
  });

  test('20220209005700_list', async () => {
    await Database.knex.migrate.up({
      name: `20220209005700_list.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
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

    await Database.knex('list').insert(list);
    await Database.knex('listItem').insert(listItem);

    await Database.knex.migrate.down({
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.up({
      name: `20220209005700_list.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex('list').insert(list);
    await Database.knex('listItem').insert(listItem);
  });

  test('20220209014700_userPreferences', async () => {
    await Database.knex.migrate.up({
      name: `20220209014700_userPreferences.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    const user = {
      id: randomNumericId(),
      name: 'name2',
      password: 'password',
      clientPreferences: {
        hideEpisodeTitleForUnseenEpisodes: true,
        hideOverviewForUnseenSeasons: true,
      },
    };

    await Database.knex('user').insert(user);

    await Database.knex.migrate.down({
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.up({
      name: `20220209014700_userPreferences.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex('user').where('id', user.id).delete();
    await Database.knex('user').insert(user);
  });

  test('20220209034100_userPreferences', async () => {
    await Database.knex.migrate.up({
      name: `20220209034100_userPreferences.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    const user = {
      id: randomNumericId(),
      name: 'name',
      password: 'password',
      hideEpisodeTitleForUnseenEpisodes: true,
      hideOverviewForUnseenSeasons: true,
    };

    await Database.knex('user').insert(user);

    await Database.knex.migrate.down({
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.up({
      name: `20220209034100_userPreferences.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex('user').where('id', user.id).delete();
    await Database.knex('user').insert(user);
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
      date: new Date().getTime() - 10,
      action: 'started',
    };

    await Database.knex('seen').insert(seen);
    await Database.knex('seen').insert(seen2);

    await Database.knex.migrate.up({
      name: `20220217012900_progress.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    const progress = await Database.knex('seen')
      .where('type', 'progress')
      .where('mediaItemId', seen.mediaItemId)
      .whereNull('episodeId')
      .first();

    const progress2 = await Database.knex('seen')
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
      userId: seen2.userId,
      progress: 0,
      date: seen2.date,
    });

    await Database.knex.migrate.down({
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.up({
      name: `20220217012900_progress.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex('seen').insert({
      userId: InitialData.user.id,
      mediaItemId: InitialData.mediaItem.id,
      progress: 0.1,
      duration: 123,
      date: new Date().getTime(),
      type: 'progress',
    });
  });

  test('20220222153600_removeMetadataProviderCredentials', async () => {
    await Database.knex.migrate.up({
      name: `20220222153600_removeMetadataProviderCredentials.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.down({
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.up({
      name: `20220222153600_removeMetadataProviderCredentials.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    const { igdbClientId, igdbClientSecret } =
      (await Database.knex('configuration').first()) || {};

    expect(igdbClientId).toEqual(InitialData.metadataProviderCredentials.value);
    expect(igdbClientSecret).toEqual(
      InitialData.metadataProviderCredentials2.value
    );
  });

  test('20220222195700_audibleCountryCode', async () => {
    await Database.knex.migrate.up({
      name: `20220222195700_audibleCountryCode.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.down({
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.up({
      name: `20220222195700_audibleCountryCode.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex('mediaItem').insert({
      id: 123456,
      title: 'Title',
      source: 'audible',
      audibleCountryCode: 'uk',
    });
  });

  test('20220310180600_userSlug', async () => {
    const user = {
      id: 1234,
      name: 'username',
      password: 'password',
      admin: false,
    };

    const user2 = {
      id: 12345,
      name: 'username-',
      password: 'password',
      admin: false,
    };

    await Database.knex('user').insert([user, user2]);

    await Database.knex.migrate.up({
      name: `20220310180600_userSlug.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.down({
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.up({
      name: `20220310180600_userSlug.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    const resUser = await Database.knex('user').where('id', user.id).first();
    const resUser2 = await Database.knex('user').where('id', user2.id).first();

    expect(toSlug(user.name)).toBe(toSlug(user2.name));
    expect(resUser.slug).not.toBe(resUser2.slug);

    await expect(async () =>
      Database.knex('user').insert({
        name: user.name,
        password: 'password',
        admin: false,
        slug: `username-${randomSlugId()}`,
      })
    ).rejects.toThrowError('UNIQUE');

    await expect(async () =>
      Database.knex('user').insert({
        name: nanoid(),
        password: 'password',
        admin: false,
        slug: resUser.slug,
      })
    ).rejects.toThrowError('UNIQUE');
  });

  test('20220312002700_mediaItemSlug', async () => {
    const mediaItem = {
      id: 1234,
      title: 'title',
      source: 'user',
      mediaType: 'movie',
    };

    const mediaItem2 = {
      id: 12345,
      title: 'title',
      source: 'user',
      mediaType: 'movie',
    };

    await Database.knex('mediaItem').insert([mediaItem, mediaItem2]);

    await Database.knex.migrate.up({
      name: `20220312002700_mediaItemSlug.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.down({
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.up({
      name: `20220312002700_mediaItemSlug.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    const resMediaItem = await Database.knex('mediaItem')
      .where('id', mediaItem.id)
      .first();
    const resMediaItem2 = await Database.knex('mediaItem')
      .where('id', mediaItem2.id)
      .first();

    expect(toSlug(mediaItem.title)).toBe(toSlug(mediaItem2.title));
    expect(resMediaItem.slug).not.toBe(resMediaItem2.slug);

    await expect(async () =>
      Database.knex('mediaItem').insert({
        title: 'title',
        source: 'user',
        mediaType: resMediaItem.mediaType,
        slug: resMediaItem.slug,
      })
    ).rejects.toThrowError('UNIQUE');
  });

  afterAll(clearDatabase);
});
