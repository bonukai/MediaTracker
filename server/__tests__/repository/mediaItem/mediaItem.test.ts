import _ from 'lodash';
import {
  MediaItemBase,
  MediaItemBaseWithSeasons,
  MediaItemForProvider,
} from 'src/entity/mediaItem';
import { mediaItemRepository } from 'src/repository/mediaItem';
import { clearDatabase, runMigrations } from '__tests__/__utils__/utils';

describe('mediaItemRepository', () => {
  beforeAll(async () => {
    await runMigrations();
  });

  afterAll(clearDatabase);

  test('create', async () => {
    await mediaItemRepository.create(mediaItem);

    const result: MediaItemBaseWithSeasons = await mediaItemRepository.findOne({
      id: 1,
    });
    result.seasons = await mediaItemRepository.seasonsWithEpisodes(result);

    expect(result.posterId).toBeDefined();
    expect(result.backdropId).toBeDefined();
    result.seasons.map((season) =>
      expect(season.posterId).toBeDefined()
    );
  });

  test('create without id', async () => {
    const mediaItem: MediaItemBaseWithSeasons = {
      title: 'mediaItem123',
      mediaType: 'tv',
      source: 'user',
      externalPosterUrl: 'poster',
      externalBackdropUrl: 'backdrop',
    };

    const returnedMediaItem = await mediaItemRepository.create(mediaItem);

    const result: MediaItemBaseWithSeasons = await mediaItemRepository.findOne({
      id: returnedMediaItem.id,
    });

    const season = await mediaItemRepository.seasonsWithEpisodes(
      returnedMediaItem
    );

    expect(result).toMatchObject(mediaItem);
    expect(result.posterId).toBeDefined();
    expect(result.backdropId).toBeDefined();
    season.map((season) => expect(season.posterId).toBeDefined());
  });

  test('update - remove images', async () => {
    const result = await mediaItemRepository.update({
      ...mediaItem,
      seasons: mediaItem.seasons.map((season) => ({
        ...season,
        externalPosterUrl: null,
      })),
      externalPosterUrl: undefined,
      externalBackdropUrl: undefined,
    });

    expect(result.posterId).toBeNull();
    expect(result.backdropId).toBeNull();

    result.seasons.map((season) => expect(season.posterId).toBeNull());
  });

  test('update - add images', async () => {
    const result = await mediaItemRepository.update(mediaItem);

    expect(result).toMatchObject(mediaItem);
    expect(result.posterId).toBeDefined();
    expect(result.backdropId).toBeDefined();
    result.seasons.map((season) =>
      expect(season.posterId).toBeDefined()
    );
  });

  test('update', async () => {
    await mediaItemRepository.update(updatedMediaItem);

    const result: MediaItemBaseWithSeasons = await mediaItemRepository.findOne({
      id: 1,
    });
    result.seasons = await mediaItemRepository.seasonsWithEpisodes(result);

    expect(result).toMatchObject(updatedMediaItem);
    expect(result.seasons.at(0).posterId).toBeDefined();
    expect(result.seasons.at(1).posterId).toBeDefined();
    expect(result.seasons.at(3).posterId).toBeDefined();
  });

  test('seasonAndEpisodeNumber', async () => {
    const mediaItem: MediaItemBaseWithSeasons = {
      id: 123,
      title: 'title111',
      source: 'user',
      mediaType: 'tv',
      seasons: [
        {
          id: 11,
          seasonNumber: 1,
          title: 'Season 1',
          isSpecialSeason: false,
          episodes: [
            {
              id: 11,
              title: 'Episode 1',
              episodeNumber: 1,
              seasonNumber: 1,
              isSpecialEpisode: false,
            },
          ],
        },
      ],
    };

    await mediaItemRepository.create(mediaItem);

    const result: MediaItemBaseWithSeasons = await mediaItemRepository.findOne({
      id: 123,
    });

    result.seasons = await mediaItemRepository.seasonsWithEpisodes(result);

    expect(result).toMatchObject({
      ...mediaItem,
      seasons: [
        {
          episodes: [
            {
              id: 11,
              seasonAndEpisodeNumber: 1001,
            },
          ],
        },
      ],
    });

    await mediaItemRepository.update({
      ...result,
      seasons: [
        {
          id: 11,
          seasonNumber: 1,
          title: 'Season 1',
          isSpecialSeason: false,
          episodes: [
            {
              id: 11,
              title: 'Episode 1',
              episodeNumber: 1,
              seasonNumber: 1,
              isSpecialEpisode: false,
            },
            {
              id: 12,
              title: 'Episode 2',
              episodeNumber: 2,
              seasonNumber: 1,
              isSpecialEpisode: false,
            },
          ],
        },
      ],
    });

    const result2: MediaItemBaseWithSeasons = await mediaItemRepository.findOne(
      {
        id: 123,
      }
    );

    result2.seasons = await mediaItemRepository.seasonsWithEpisodes(result2);

    expect(result2).toMatchObject({
      ...mediaItem,
      seasons: [
        {
          episodes: [
            {
              seasonAndEpisodeNumber: 1001,
            },
            {
              seasonAndEpisodeNumber: 1002,
            },
          ],
        },
      ],
    });
  });

  test('mergeSearchResultWithExistingItems', async () => {
    const existingItems: MediaItemBase[] = [
      {
        id: 77771,
        tmdbId: 1234567,
        source: 'user',
        mediaType: 'tv',
        title: 'Item 1',
        externalPosterUrl: 'poster',
        externalBackdropUrl: 'backdrop',
      },
      {
        id: 77772,
        imdbId: 'tt876123',
        source: 'user',
        mediaType: 'tv',
        title: 'Item 4',
      },
      {
        id: 77773,
        tmdbId: 9875321,
        source: 'user',
        mediaType: 'tv',
        title: 'Item 2',
      },
    ];

    const searchResult: MediaItemForProvider[] = [
      {
        tmdbId: 1234567,
        source: 'user',
        mediaType: 'tv',
        title: 'Item 1',
      },
      {
        tmdbId: 1234567,
        source: 'user',
        mediaType: 'tv',
        title: 'Item 1 duplicate',
      },
      {
        tmdbId: 9875321,
        source: 'user',
        mediaType: 'tv',
        title: 'Item 2',
      },
      {
        imdbId: 'tt1234567',
        source: 'user',
        mediaType: 'tv',
        externalPosterUrl: 'poster',
        externalBackdropUrl: 'backdrop',
        title: 'Item 3',
      },
      {
        imdbId: 'tt876123',
        tmdbId: 77812332,
        source: 'user',
        mediaType: 'tv',
        title: 'new Title 4',
        overview: 'new overview',
      },
      {
        tmdbId: 998,
        source: 'tmdb',
        mediaType: 'tv',
        title: 'title123',
      },
      {
        tmdbId: 999,
        source: 'tmdb',
        mediaType: 'tv',
        title: 'title123',
      },
      {
        tmdbId: 999,
        source: 'tmdb',
        mediaType: 'tv',
        title: 'title123 duplicate',
      },
    ];

    await mediaItemRepository.createMany(existingItems);

    const res = await mediaItemRepository.mergeSearchResultWithExistingItems(
      searchResult,
      'tv'
    );

    const insertedMediaItem = await mediaItemRepository.findOne({
      imdbId: 'tt1234567',
    });

    expect(res[3].posterId).toBeDefined();
    expect(res[3].backdropId).toBeDefined();

    const expected = [
      existingItems[0],
      existingItems[0],
      existingItems[2],
      {
        ...searchResult[3],
        id: insertedMediaItem.id,
      },
      existingItems[1],
      searchResult[5],
      searchResult[6],
      searchResult[6],
    ];

    expect(res).toMatchObject(expected);

    expect(insertedMediaItem).toMatchObject(searchResult[3]);
  });
});

const mediaItem: MediaItemBaseWithSeasons = {
  id: 1,
  lastTimeUpdated: new Date().getTime(),
  mediaType: 'tv',
  source: 'user',
  title: 'title2',
  audibleId: null,
  authors: null,
  externalBackdropUrl: 'backdrop',
  developer: null,
  genres: null,
  igdbId: null,
  imdbId: null,
  language: null,
  lockedAt: null,
  narrators: null,
  needsDetails: false,
  network: null,
  numberOfSeasons: null,
  openlibraryId: null,
  originalTitle: null,
  overview: null,
  platform: null,
  externalPosterUrl: 'poster',
  releaseDate: null,
  runtime: null,
  status: null,
  tmdbId: null,
  tmdbRating: null,
  tvmazeId: null,
  url: null,
  goodreadsId: null,
  numberOfPages: null,
  traktId: null,
  audibleCountryCode: null,
  tvdbId: null,
  seasons: [
    {
      id: 1,
      seasonNumber: 1,
      numberOfEpisodes: 2,
      title: 'Season 1',
      isSpecialSeason: false,
      description: null,
      externalPosterUrl: 'poster',
      releaseDate: null,
      tmdbId: null,
      traktId: null,
      tvdbId: null,
      tvShowId: 1,
      episodes: [
        {
          id: 1,
          episodeNumber: 1,
          seasonId: 1,
          seasonNumber: 1,
          title: 'Episode 1',
          releaseDate: '2001-02-20',
          isSpecialEpisode: false,
          seasonAndEpisodeNumber: 1001,
          tvShowId: 1,
          description: null,
          imdbId: null,
          tmdbId: null,
          runtime: null,
          traktId: null,
          tvdbId: null,
        },
        {
          id: 2,
          episodeNumber: 2,
          seasonId: 1,
          seasonNumber: 1,
          title: 'Episode 2',
          releaseDate: '2001-02-21',
          isSpecialEpisode: false,
          seasonAndEpisodeNumber: 1002,
          tvShowId: 1,
          description: null,
          imdbId: null,
          tmdbId: null,
          runtime: null,
          traktId: null,
          tvdbId: null,
        },
      ],
    },
    {
      id: 2,
      seasonNumber: 2,
      numberOfEpisodes: 2,
      title: 'Season 2',
      tvShowId: 1,
      isSpecialSeason: false,
      description: null,
      externalPosterUrl: null,
      posterId: null,
      releaseDate: null,
      tmdbId: null,
      traktId: null,
      tvdbId: null,
      episodes: [
        {
          id: 3,
          episodeNumber: 1,
          seasonId: 2,
          seasonNumber: 2,
          title: 'Episode 1',
          releaseDate: '2002-02-20',
          isSpecialEpisode: false,
          seasonAndEpisodeNumber: 2001,
          tvShowId: 1,
          description: null,
          imdbId: null,
          tmdbId: null,
          runtime: null,
          traktId: null,
          tvdbId: null,
        },
      ],
    },
    {
      id: 3,
      seasonNumber: 3,
      numberOfEpisodes: 0,
      title: 'Season 3',
      tvShowId: 1,
      isSpecialSeason: false,
      description: null,
      episodes: undefined,
      externalPosterUrl: null,
      posterId: null,
      releaseDate: null,
      tmdbId: null,
      traktId: null,
      tvdbId: null,
    },
  ],
};

const updatedMediaItem = {
  ...mediaItem,
  overview: 'new overview',
  lastTimeUpdated: new Date().getTime(),
  title: 'new title',
  audibleId: 'audibleId',
  authors: ['author', 'author 2'],
  externalBackdropUrl: 'backdrop',
  developer: 'developer',
  genres: ['genre', 'genre2'],
  igdbId: 789,
  imdbId: 'imdbId',
  language: 'language',
  narrators: ['narrator', 'narrator2'],
  needsDetails: false,
  network: 'network',
  numberOfSeasons: 5,
  openlibraryId: 'openlibraryId',
  originalTitle: 'originalTitle',
  platform: ['platform', 'platform2'],
  externalPosterUrl: 'poster',
  releaseDate: '2000-08-12',
  runtime: 51,
  status: 'status',
  tmdbId: 123,
  tmdbRating: 8.1,
  tvmazeId: 456,
  goodreadsId: 123,
  numberOfPages: 761,
  traktId: 3123,
  tvdbId: 5442,
  url: 'url',
  seasons: [
    mediaItem.seasons[0],
    {
      ...mediaItem.seasons[1],
      episodes: [
        ...mediaItem.seasons[1].episodes,
        {
          id: 5,
          episodeNumber: 2,
          seasonId: 2,
          seasonNumber: 2,
          title: 'Episode 2',
          releaseDate: '2002-02-21',
          isSpecialEpisode: false,
          seasonAndEpisodeNumber: 2002,
          tvShowId: 1,
          description: null,
          imdbId: null,
          tmdbId: null,
          runtime: null,
          traktId: 53243124,
          tvdbId: 65412,
        },
      ],
    },
    mediaItem.seasons[2],
    {
      id: 4,
      seasonNumber: 4,
      numberOfEpisodes: 1,
      title: 'Season 4',
      tvShowId: 1,
      isSpecialSeason: false,
      description: null,
      traktId: 3215415,
      tvdbId: 5232134,
      episodes: [
        {
          id: 6,
          episodeNumber: 1,
          seasonId: 4,
          seasonNumber: 4,
          title: 'Episode 1',
          releaseDate: '2002-06-20',
          isSpecialEpisode: false,
          seasonAndEpisodeNumber: 4001,
          tvShowId: 1,
          description: null,
          imdbId: null,
          tmdbId: null,
          runtime: null,
          traktId: 76412,
          tvdbId: 5324,
        },
      ],
      externalPosterUrl: 'poster',
      releaseDate: null,
      tmdbId: null,
    },
  ],
};
