import { clearDatabase, runMigrations } from '__tests__/__utils__/utils';
import { Database } from 'src/dbconfig';
import { MediaItemBase } from 'src/entity/mediaItem';
import { MetadataProvider } from 'src/metadata/metadataProvider';
import { metadataProviders } from 'src/metadata/metadataProviders';
import { updateMediaItem } from 'src/updateMetadata';

jest.mock('src/metadata/metadataProviders');

const mockedMetadataProviders = metadataProviders as jest.Mocked<
  typeof metadataProviders
>;

const tvShow: MediaItemBase = {
  id: 1,
  lastTimeUpdated: new Date().getTime(),
  mediaType: 'tv',
  source: 'user',
  title: 'title',
  slug: 'title',
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

const season2 = {
  id: 2,
  seasonNumber: 2,
  numberOfEpisodes: 1,
  title: 'Season 2',
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

const episode3 = {
  id: 3,
  episodeNumber: 1,
  seasonNumber: 2,
  seasonAndEpisodeNumber: 1002,
  title: 'Episode 2',
  releaseDate: '2002-02-20',
  isSpecialEpisode: false,
  tvShowId: tvShow.id,
  seasonId: season2.id,
};

const movie = {
  id: 2,
  lastTimeUpdated: new Date().getTime(),
  mediaType: 'movie',
  source: 'user',
  title: 'title2',
  slug: 'title2',
  runtime: 120,
};

const user = {
  id: 1,
  name: 'admin',
  admin: true,
  password: 'password',
  publicReviews: false,
};

const list = {
  id: 1,
  name: 'watchlist',
  userId: user.id,
  isWatchlist: true,
  createdAt: new Date().getTime(),
  updatedAt: new Date().getTime(),
  privacy: 'private',
  allowComments: false,
  displayNumbers: false,
  sortBy: 'recently-added',
  sortOrder: 'asc',
};

const mediaItem = {
  ...tvShow,
  seasons: [
    {
      ...season,
      episodes: [episode, episode2],
    },
    {
      ...season2,
      episodes: [episode3],
    },
  ],
};

describe('updateMediaItem', () => {
  beforeAll(async () => {
    await runMigrations();
    await Database.knex('user').insert(user);

    await Database.knex('mediaItem').insert(tvShow);
    await Database.knex('season').insert(season);
    await Database.knex('season').insert(season2);
    await Database.knex('episode').insert(episode);
    await Database.knex('episode').insert(episode2);
    await Database.knex('episode').insert(episode3);

    await Database.knex('mediaItem').insert(movie);
    await Database.knex('list').insert(list);

    mockedMetadataProviders.get.mockImplementation(() => {
      return {
        details: async () => {
          return {
            mediaType: 'tv',
            source: 'user',
            title: 'new title',
            runtime: 45,
            seasons: [
              {
                seasonNumber: 2,
                numberOfEpisodes: 2,
                title: 'new season title',
                isSpecialSeason: false,
              },
            ],
          };
        },
      } as unknown as MetadataProvider;
    });
  });

  afterAll(clearDatabase);

  test('seen episodes should not be deleted', async () => {
    await Database.knex('seen').insert({
      userId: user.id,
      mediaItemId: tvShow.id,
      episodeId: episode.id,
    });

    await testUpdateTvShowFailureOnEpisodes();

    await Database.knex('seen').delete();
  });

  test('episode with progress should not be deleted', async () => {
    await Database.knex('progress').insert({
      userId: user.id,
      mediaItemId: tvShow.id,
      episodeId: episode.id,
      progress: 0.2,
      date: Date.now(),
    });

    await testUpdateTvShowFailureOnEpisodes();

    await Database.knex('progress').delete();
  });

  test('episode on list should not be deleted', async () => {
    await Database.knex('listItem').insert({
      listId: list.id,
      mediaItemId: tvShow.id,
      episodeId: episode.id,
      addedAt: Date.now(),
    });

    await testUpdateTvShowFailureOnEpisodes();

    await Database.knex('listItem').delete();
  });

  test('episode with rating should not be deleted', async () => {
    await Database.knex('userRating').insert({
      userId: user.id,
      mediaItemId: tvShow.id,
      episodeId: episode.id,
      rating: 5,
      date: Date.now(),
    });

    await testUpdateTvShowFailureOnEpisodes();

    await Database.knex('userRating').delete();
  });

  test('season with rating should not be deleted', async () => {
    await Database.knex('userRating').insert({
      userId: user.id,
      mediaItemId: tvShow.id,
      seasonId: season.id,
      rating: 5,
      date: Date.now(),
    });

    await testUpdateTvShowFailureOnEpisodes();

    await Database.knex('userRating').delete();
  });

  test('should delete missing episodes and season', async () => {
    await Database.knex('notificationsHistory').insert({
      mediaItemId: tvShow.id,
      episodeId: episode.id,
      sendDate: Date.now(),
    });

    await Database.knex('image').insert({
      mediaItemId: tvShow.id,
      seasonId: season.id,
      type: 'poster',
    });

    const updatedMediaItem = await updateMediaItem(mediaItem);

    expect(updatedMediaItem.seasons?.length).toEqual(1);
    expect(updatedMediaItem.seasons?.at(0)?.episodes?.length || 0).toEqual(0);
  });
});

const testUpdateTvShowFailureOnEpisodes = async () => {
  const updatedMediaItem = await updateMediaItem(mediaItem);

  expect(mediaItem.title).not.toBe(updatedMediaItem.title);
  expect(mediaItem.runtime).not.toBe(updatedMediaItem.runtime);
  expect(mediaItem.seasons.length).toBe(updatedMediaItem.seasons.length);
  expect(mediaItem.seasons?.map((season) => season.episodes?.length)).toEqual(
    updatedMediaItem.seasons?.map((season) => season.episodes?.length)
  );
};
