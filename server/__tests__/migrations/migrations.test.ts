import { milliseconds } from 'date-fns';

import { Config } from 'src/config';
import { clearDatabase, randomNumericId } from '../__utils__/utils';
import { Data, InitialData } from '__tests__/__utils__/data';
import { Image } from 'src/entity/image';
import { Configuration } from 'src/entity/configuration';
import { MediaItemBase } from 'src/entity/mediaItem';
import { Database } from 'src/dbconfig';
import { randomSlugId, toSlug } from 'src/slug';
import { nanoid } from 'nanoid';
import { listRepository } from 'src/repository/list';
import { ListSortBy } from 'src/entity/list';
import { listItemRepository } from 'src/repository/listItemRepository';

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

    const watchlist = {
      id: 777,
      userId: 1,
      mediaItemId: 1,
      addedAt: new Date().getTime(),
    };

    await Database.knex('watchlist').insert(watchlist);

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
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_UNIQUE' });

    await expect(async () =>
      Database.knex('user').insert({
        name: nanoid(),
        password: 'password',
        admin: false,
        slug: resUser.slug,
      })
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_UNIQUE' });
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
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_UNIQUE' });
  });

  test('20220317214800_tvdbIdTraktId', async () => {
    await Database.knex.migrate.up({
      name: `20220317214800_tvdbIdTraktId.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.down({
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.up({
      name: `20220317214800_tvdbIdTraktId.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    const tvdbId = 12345;
    const traktId = 12345;

    const mediaItem = {
      id: 8888,
      title: 'title1234',
      slug: 'title1234',
      source: 'user',
      mediaType: 'movie',
      tvdbId: tvdbId,
    };

    const season = {
      id: 8888,
      title: 'title1234',
      seasonNumber: 1,
      numberOfEpisodes: 1,
      tvShowId: mediaItem.id,
      isSpecialSeason: false,
      tvdbId: tvdbId,
      traktId: traktId,
    };

    const episode = {
      id: 8888,
      title: 'title1234',
      seasonNumber: 1,
      episodeNumber: 1,
      seasonAndEpisodeNumber: 1001,
      seasonId: season.id,
      tvShowId: mediaItem.id,
      isSpecialEpisode: false,
      tvdbId: tvdbId,
      traktId: traktId,
    };

    await Database.knex('mediaItem').insert(mediaItem);

    await expect(
      async () =>
        await Database.knex('mediaItem').insert({
          ...mediaItem,
          id: 88881,
        })
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_UNIQUE' });

    await Database.knex('season').insert(season);

    await expect(
      async () =>
        await Database.knex('season').insert({
          ...season,
          id: 88881,
          title: 'title12345',
          tvdbId: tvdbId,
          traktId: 999,
        })
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_UNIQUE' });

    await expect(
      async () =>
        await Database.knex('season').insert({
          ...season,
          id: 88881,
          title: 'title12345',
          tvdbId: 999,
          traktId: traktId,
        })
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_UNIQUE' });

    await Database.knex('episode').insert(episode);

    await expect(
      async () =>
        await Database.knex('episode').insert({
          ...episode,
          id: 88881,
          title: 'title12345',
          seasonNumber: 1,
          episodeNumber: 2,
          seasonAndEpisodeNumber: 1002,
          tvdbId: tvdbId,
          traktId: 999,
        })
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_UNIQUE' });

    await expect(
      async () =>
        await Database.knex('episode').insert({
          ...episode,
          id: 88881,
          title: 'title12345',
          seasonNumber: 1,
          episodeNumber: 2,
          seasonAndEpisodeNumber: 1002,
          tvdbId: 999,
          traktId: traktId,
        })
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_UNIQUE' });
  });

  test('20220404141200_seenDateToNull', async () => {
    const seen = {
      id: 9999,
      userId: InitialData.user.id,
      mediaItemId: InitialData.mediaItem.id,
      date: 0,
      type: 'seen',
    };

    const seen2 = {
      id: 99999,
      userId: InitialData.user.id,
      mediaItemId: InitialData.mediaItem.id,
      date: 0.0,
      type: 'seen',
    };

    await Database.knex('seen').insert(seen);
    await Database.knex('seen').insert(seen2);

    await Database.knex.migrate.up({
      name: `20220404141200_seenDateToNull.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.down({
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.up({
      name: `20220404141200_seenDateToNull.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    const resSeen = await Database.knex('seen').where('id', seen.id).first();
    const resSeen2 = await Database.knex('seen').where('id', seen2.id).first();

    expect(resSeen.date).toBeNull();
    expect(resSeen2.date).toBeNull();
  });

  test('20220406165800_uniqueSeasonAndEpisodeNumbers', async () => {
    await Database.knex.migrate.up({
      name: `20220406165800_uniqueSeasonAndEpisodeNumbers.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.down({
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.up({
      name: `20220406165800_uniqueSeasonAndEpisodeNumbers.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    const mediaItem = {
      id: 1234567,
      title: 'title1234567',
      slug: 'title1234567',
      source: 'user',
      mediaType: 'movie',
    };

    const season = {
      id: 12345,
      title: 'title12345',
      seasonNumber: 1,
      numberOfEpisodes: 1,
      tvShowId: mediaItem.id,
      isSpecialSeason: false,
    };

    const episode = {
      id: 12345,
      title: 'title12345',
      seasonNumber: 1,
      episodeNumber: 1,
      seasonAndEpisodeNumber: 1001,
      seasonId: season.id,
      tvShowId: mediaItem.id,
      isSpecialEpisode: false,
    };

    await Database.knex('mediaItem').insert(mediaItem);
    await Database.knex('season').insert(season);
    await Database.knex('episode').insert(episode);

    await expect(
      async () =>
        await Database.knex('episode').insert({
          ...episode,
          id: 123456,
        })
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_UNIQUE' });

    await expect(
      async () =>
        await Database.knex('season').insert({
          ...season,
          id: 123456,
        })
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_UNIQUE' });
  });

  test('20220427211100_list', async () => {
    await Database.knex.migrate.up({
      name: `20220427211100_list.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.down({
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.up({
      name: `20220427211100_list.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });
  });

  test('20220427212000_watchlistToList', async () => {
    const watchlistItem = {
      userId: InitialData.user.id,
      mediaItemId: InitialData.mediaItem.id,
      addedAt: new Date().getTime(),
    };

    await Database.knex('watchlist').insert(watchlistItem);

    const { watchlistSize: watchlistSize } = await Database.knex('watchlist')
      .count({
        watchlistSize: '*',
      })
      .first();

    const { listItemSizeBefore } = await Database.knex('listItem')
      .count({
        listItemSizeBefore: '*',
      })
      .first();

    await Database.knex.migrate.up({
      name: `20220427212000_watchlistToList.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.down({
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.up({
      name: `20220427212000_watchlistToList.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    const { listItemSizeAfter } = await Database.knex('listItem')
      .count({
        listItemSizeAfter: '*',
      })
      .first();

    expect(watchlistSize + listItemSizeBefore).toBe(listItemSizeAfter);

    const watchlist = await Database.knex('list')
      .where('isWatchlist', true)
      .where('userId', watchlistItem.userId)
      .first();

    expect(watchlist).toBeDefined();

    expect(
      await Database.knex('listItem')
        .where('listId', watchlist.id)
        .where('mediaItemId', watchlistItem.mediaItemId)
        .where('addedAt', watchlistItem.addedAt)
        .first()
    ).toBeDefined();
  });

  test('20220603191400_listTraktId', async () => {
    await Database.knex.migrate.up({
      name: `20220603191400_listTraktId.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.down({
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.up({
      name: `20220603191400_listTraktId.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex('list').insert({
      rank: 999,
      name: 'trakt-list',
      slug: 'trakt-list',
      traktId: 12345,
      privacy: 'private',
      sortBy: 'rank',
      sortOrder: 'asc',
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
      userId: InitialData.user.id,
      isWatchlist: false,
    });
  });

  test('20230205000000_uniqueExternalIds', async () => {
    await Database.knex('mediaItem').insert([
      {
        id: 91,
        title: '91',
        mediaType: 'movie',
        source: 'user',
        slug: '91',
        imdbId: '',
      },
      {
        id: 92,
        title: '92',
        mediaType: 'movie',
        source: 'user',
        slug: '92',
        imdbId: '',
      },
    ]);

    await Database.knex.migrate.up({
      name: `20230205000000_uniqueExternalIds.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.down({
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.up({
      name: `20230205000000_uniqueExternalIds.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await expect(
      async () =>
        await Database.knex('season').insert([
          {
            id: 123456,
            title: 'Season 2',
            seasonNumber: 8,
            isSpecialSeason: false,
            numberOfEpisodes: 1,
            tvShowId: InitialData.mediaItem.id,
            tmdbId: 123,
          },
          {
            id: 123457,
            title: 'Season 2',
            seasonNumber: 9,
            isSpecialSeason: false,
            numberOfEpisodes: 1,
            tvShowId: InitialData.mediaItem.id,
            tmdbId: 123,
          },
        ])
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_UNIQUE' });

    await expect(
      async () =>
        await Database.knex('episode').insert([
          {
            id: 123456,
            title: 'Episode 1',
            seasonNumber: 8,
            episodeNumber: 1,
            seasonAndEpisodeNumber: 8001,
            isSpecialEpisode: false,
            tvShowId: InitialData.mediaItem.id,
            seasonId: InitialData.season.id,
            tmdbId: 123,
          },
          {
            id: 123457,
            title: 'Episode 2',
            seasonNumber: 8,
            episodeNumber: 12,
            seasonAndEpisodeNumber: 8002,
            isSpecialEpisode: false,
            tvShowId: InitialData.mediaItem.id,
            seasonId: InitialData.season.id,
            tmdbId: 123,
          },
        ])
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_UNIQUE' });

    await expect(
      async () =>
        await Database.knex('episode').insert([
          {
            id: 123456,
            title: 'Episode 1',
            seasonNumber: 8,
            episodeNumber: 1,
            seasonAndEpisodeNumber: 8001,
            isSpecialEpisode: false,
            tvShowId: InitialData.mediaItem.id,
            seasonId: InitialData.season.id,
            imdbId: '123',
          },
          {
            id: 123457,
            title: 'Episode 2',
            seasonNumber: 8,
            episodeNumber: 12,
            seasonAndEpisodeNumber: 8002,
            isSpecialEpisode: false,
            tvShowId: InitialData.mediaItem.id,
            seasonId: InitialData.season.id,
            imdbId: '123',
          },
        ])
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_UNIQUE' });

    await expect(
      async () =>
        await Database.knex('mediaItem').insert([
          {
            id: 81,
            title: '81',
            mediaType: 'movie',
            source: 'user',
            slug: '81',
            imdbId: 123,
          },
          {
            id: 82,
            title: '82',
            mediaType: 'movie',
            source: 'user',
            slug: '82',
            imdbId: 123,
          },
        ])
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_UNIQUE' });

    await expect(
      async () =>
        await Database.knex('mediaItem').insert([
          {
            id: 81,
            title: '81',
            mediaType: 'movie',
            source: 'user',
            slug: '81',
            tmdbId: '123',
          },
          {
            id: 82,
            title: '82',
            mediaType: 'movie',
            source: 'user',
            slug: '82',
            tmdbId: '123',
          },
        ])
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_UNIQUE' });

    await expect(
      async () =>
        await Database.knex('mediaItem').insert([
          {
            id: 81,
            title: '81',
            mediaType: 'movie',
            source: 'user',
            slug: '81',
            tvmazeId: 123,
          },
          {
            id: 82,
            title: '82',
            mediaType: 'movie',
            source: 'user',
            slug: '82',
            tvmazeId: 123,
          },
        ])
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_UNIQUE' });

    await expect(
      async () =>
        await Database.knex('mediaItem').insert([
          {
            id: 81,
            title: '81',
            mediaType: 'movie',
            source: 'user',
            slug: '81',
            traktId: 123,
          },
          {
            id: 82,
            title: '82',
            mediaType: 'movie',
            source: 'user',
            slug: '82',
            traktId: 123,
          },
        ])
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_UNIQUE' });

    await expect(
      async () =>
        await Database.knex('mediaItem').insert([
          {
            id: 81,
            title: '81',
            mediaType: 'movie',
            source: 'user',
            slug: '81',
            igdbId: 123,
          },
          {
            id: 82,
            title: '82',
            mediaType: 'movie',
            source: 'user',
            slug: '82',
            igdbId: 123,
          },
        ])
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_UNIQUE' });

    await expect(
      async () =>
        await Database.knex('mediaItem').insert([
          {
            id: 81,
            title: '81',
            mediaType: 'movie',
            source: 'user',
            slug: '81',
            openlibraryId: 123,
          },
          {
            id: 82,
            title: '82',
            mediaType: 'movie',
            source: 'user',
            slug: '82',
            openlibraryId: 123,
          },
        ])
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_UNIQUE' });

    await expect(
      async () =>
        await Database.knex('mediaItem').insert([
          {
            id: 81,
            title: '81',
            mediaType: 'movie',
            source: 'user',
            slug: '81',
            audibleId: 123,
          },
          {
            id: 82,
            title: '82',
            mediaType: 'movie',
            source: 'user',
            slug: '82',
            audibleId: 123,
          },
        ])
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_UNIQUE' });

    await expect(
      async () =>
        await Database.knex('mediaItem').insert([
          {
            id: 81,
            title: '81',
            mediaType: 'movie',
            source: 'user',
            slug: '81',
            goodreadsId: 123,
          },
          {
            id: 82,
            title: '82',
            mediaType: 'movie',
            source: 'user',
            slug: '82',
            goodreadsId: 123,
          },
        ])
    ).rejects.toMatchObject({ code: 'SQLITE_CONSTRAINT_UNIQUE' });

    await Database.knex('mediaItem').insert([
      {
        id: 101,
        title: '101',
        mediaType: 'movie',
        source: 'user',
        slug: '101',
        tmdbId: 123456,
      },
      {
        id: 102,
        title: '102',
        mediaType: 'tv',
        source: 'user',
        slug: '102',
        tmdbId: 123456,
      },
    ]);

    await Database.knex('mediaItem').insert([
      {
        id: 201,
        title: '201',
        mediaType: 'movie',
        source: 'user',
        slug: '201',
        imdbId: 123456,
      },
      {
        id: 202,
        title: '202',
        mediaType: 'tv',
        source: 'user',
        slug: '202',
        imdbId: 123456,
      },
    ]);

    await Database.knex('mediaItem').insert([
      {
        id: 301,
        title: '301',
        mediaType: 'movie',
        source: 'user',
        slug: '301',
        tvmazeId: 123456,
      },
      {
        id: 302,
        title: '302',
        mediaType: 'tv',
        source: 'user',
        slug: '302',
        tvmazeId: 123456,
      },
    ]);

    await Database.knex('mediaItem').insert([
      {
        id: 401,
        title: '401',
        mediaType: 'movie',
        source: 'user',
        slug: '401',
        traktId: 123456,
      },
      {
        id: 402,
        title: '402',
        mediaType: 'tv',
        source: 'user',
        slug: '402',
        traktId: 123456,
      },
    ]);

    await Database.knex('mediaItem').insert([
      {
        id: 501,
        title: '501',
        mediaType: 'movie',
        source: 'user',
        slug: '501',
        igdbId: 123456,
      },
      {
        id: 502,
        title: '502',
        mediaType: 'tv',
        source: 'user',
        slug: '502',
        igdbId: 123456,
      },
    ]);

    await Database.knex('mediaItem').insert([
      {
        id: 601,
        title: '601',
        mediaType: 'movie',
        source: 'user',
        slug: '601',
        openlibraryId: 123456,
      },
      {
        id: 602,
        title: '602',
        mediaType: 'tv',
        source: 'user',
        slug: '602',
        openlibraryId: 123456,
      },
    ]);

    await Database.knex('mediaItem').insert([
      {
        id: 701,
        title: '701',
        mediaType: 'movie',
        source: 'user',
        slug: '701',
        audibleId: 123456,
      },
      {
        id: 702,
        title: '702',
        mediaType: 'tv',
        source: 'user',
        slug: '702',
        audibleId: 123456,
      },
    ]);

    await Database.knex('mediaItem').insert([
      {
        id: 801,
        title: '801',
        mediaType: 'movie',
        source: 'user',
        slug: '801',
        goodreadsId: 123456,
      },
      {
        id: 802,
        title: '802',
        mediaType: 'tv',
        source: 'user',
        slug: '802',
        goodreadsId: 123456,
      },
    ]);
  });

  test('20230422000000_updateListRanks', async () => {
    const initialLists = await Database.knex('list');
    const initialListItems = await Database.knex('listItem');

    await Database.knex('listItem').delete();
    await Database.knex('list').delete();
    await Database.knex('list').insert([
      {
        id: 0,
        rank: 0,
        name: 'List',
        slug: 'list',
        privacy: 'private',
        sortBy: 'rank',
        sortOrder: 'asc',
        createdAt: new Date().getTime(),
        updatedAt: new Date().getTime(),
        userId: InitialData.user.id,
        isWatchlist: false,
      },
      {
        id: 1,
        rank: 1,
        name: 'List 2',
        slug: 'list-2',
        privacy: 'private',
        sortBy: 'rank',
        sortOrder: 'asc',
        createdAt: new Date().getTime(),
        updatedAt: new Date().getTime(),
        userId: InitialData.user.id,
        isWatchlist: false,
      },
      {
        id: 3,
        rank: 3,
        name: 'List 3',
        slug: 'list-3',
        privacy: 'private',
        sortBy: 'rank',
        sortOrder: 'asc',
        createdAt: new Date().getTime(),
        updatedAt: new Date().getTime(),
        userId: InitialData.user.id,
        isWatchlist: false,
      },
      {
        id: 4,
        rank: 4,
        name: 'List 4',
        slug: 'list-4',
        privacy: 'private',
        sortBy: 'rank',
        sortOrder: 'asc',
        createdAt: new Date().getTime(),
        updatedAt: new Date().getTime(),
        userId: InitialData.user.id,
        isWatchlist: false,
      },
    ]);

    await Database.knex.migrate.up({
      name: `20230422000000_updateListRanks.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.down({
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.up({
      name: `20230422000000_updateListRanks.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    const lists = await Database.knex('list')
      .select('name', 'rank')
      .where('userId', InitialData.user.id)
      .orderBy('rank');

    expect(lists).toEqual([
      { name: 'List', rank: 0 },
      { name: 'List 2', rank: 1 },
      { name: 'List 3', rank: 2 },
      { name: 'List 4', rank: 3 },
    ]);

    await Database.knex('listItem').delete();
    await Database.knex('list').delete();
    await Database.knex('list').insert(initialLists);
    await Database.knex('listItem').insert(initialListItems);
  });

  test('20230501000000_progress', async () => {
    const date = Date.now();

    await Database.knex('seen').where('type', 'progress').delete();

    await Database.knex('seen').insert([
      {
        mediaItemId: InitialData.mediaItem.id,
        type: 'progress',
        progress: 0.1,
        date: date - 100,
        userId: InitialData.user.id,
      },
      {
        mediaItemId: InitialData.mediaItem.id,
        type: 'progress',
        progress: 0.2,
        date: date - 90,
        userId: InitialData.user.id,
      },
      {
        mediaItemId: InitialData.mediaItem.id,
        type: 'progress',
        progress: 0.3,
        date: date - 80,
        userId: InitialData.user.id,
      },
      {
        mediaItemId: InitialData.mediaItem.id,
        type: 'progress',
        progress: 0.4,
        date: date - 70,
        userId: InitialData.user.id,
      },
    ]);

    await Database.knex.migrate.up({
      name: `20230501000000_progress.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.down({
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.up({
      name: `20230501000000_progress.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    const progress = await Database.knex('progress');

    expect(progress.length).toBe(1);
    expect(progress.at(0).mediaItemId).toBe(InitialData.mediaItem.id);
    expect(progress.at(0).progress).toBe(0.4);
    expect(progress.at(0).date).toBe(date - 70);
    expect(progress.at(0).userId).toBe(InitialData.user.id);
  });

  test('20230511000000_dropRankInList', async () => {
    const listId = 999;
    const { count } = await Database.knex('list')
      .where('userId', InitialData.user.id)
      .count({ count: '*' })
      .as('count')
      .first();

    await Database.knex('list').insert({
      id: listId,
      name: 'migration test',
      slug: 'migration-test',
      userId: InitialData.user.id,
      sortBy: 'rank' as unknown as ListSortBy,
      rank: count,
      privacy: 'private',
      sortOrder: 'asc',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isWatchlist: false,
    });

    await Database.knex.migrate.up({
      name: `20230511000000_dropRankInList.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.down({
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    expect(
      await Database.knex('list')
        .where('userId', InitialData.user.id)
        .orderBy('id')
        .select('rank')
    ).toEqual(
      new Array(count + 1).fill(null).map((_, index) => ({ rank: index }))
    );

    await Database.knex.migrate.up({
      name: `20230511000000_dropRankInList.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });
  });

  test('20230512000001_dropSlugInList', async () => {
    await Database.knex.migrate.up({
      name: `20230512000001_dropSlugInList.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.down({
      directory: Config.MIGRATIONS_DIRECTORY,
    });

    await Database.knex.migrate.up({
      name: `20230512000001_dropSlugInList.${Config.MIGRATIONS_EXTENSION}`,
      directory: Config.MIGRATIONS_DIRECTORY,
    });
  });

  afterAll(clearDatabase);
});
