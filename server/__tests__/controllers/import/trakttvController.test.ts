import axios from 'axios';
import { parseISO } from 'date-fns';

import { TraktTvImportController } from 'src/controllers/import/traktTv';
import { Database } from 'src/dbconfig';

import { Data } from '__tests__/__utils__/data';
import { request } from '__tests__/__utils__/request';
import { clearDatabase, runMigrations } from '__tests__/__utils__/utils';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const traktTvImportController = new TraktTvImportController();

describe('TraktTv import', () => {
  afterAll(clearDatabase);

  beforeAll(async () => {
    await runMigrations();

    await Database.knex('user').insert(Data.user);
    await Database.knex('mediaItem').insert(Data.movie);
    await Database.knex('mediaItem').insert(Data.tvShow);
    await Database.knex('season').insert(Data.season);
    await Database.knex('episode').insert(Data.episode);
    await Database.knex('episode').insert(Data.episode2);
    await Database.knex('episode').insert(Data.episode3);

    mockedAxios.post.mockImplementation(
      async (url) =>
        ({
          'https://api.trakt.tv/oauth/device/code': {
            data: {
              device_code:
                '2e86272e5dcc6b0296228ec473891162cbc11075846e5be7b1ce8666904eb3c',
              user_code: '12345678',
              verification_url: 'https://trakt.tv/activate',
              expires_in: 600,
              interval: 1,
            },
            status: 200,
          },
          'https://api.trakt.tv/oauth/device/token': {
            data: {
              access_token:
                '8dc159aa975093a44b0e0052ba8afd99aff8044e9532a7d5e1bc638833ebac3b',
              token_type: 'bearer',
              expires_in: 7776000,
              refresh_token:
                'cea3fe948f2f4ffddec3f311d26e95c739bf54a82617ba1a68b1f6c3ab16c68f',
              scope: 'public',
              created_at: 1649960457,
            },
            status: 200,
          },
        }[url])
    );
  });

  test('state should be uninitialized at the beginning', async () => {
    const res = await request(traktTvImportController.state, {
      userId: Data.user.id,
    });

    expect(res.data).toEqual({ state: 'uninitialized' });
  });

  test('should import', async () => {
    mockedAxios.get.mockImplementation(
      async (url, { data }) =>
        ({
          'https://api.trakt.tv/sync/watchlist': {
            status: 200,
            data: [
              {
                rank: 1,
                id: 1,
                listed_at: new Date().toISOString(),
                type: 'movie',
                movie: {
                  title: Data.movie.title,
                  year: parseISO(Data.movie.releaseDate).getFullYear(),
                  ids: {
                    slug: Data.movie.slug,
                    tmdb: Data.movie.tmdbId,
                  },
                },
              },
              {
                rank: 2,
                id: 2,
                listed_at: new Date().toISOString(),
                type: 'show',
                show: {
                  title: Data.tvShow.title,
                  year: parseISO(Data.tvShow.releaseDate).getFullYear(),
                  ids: {
                    slug: Data.tvShow.slug,
                    tmdb: Data.tvShow.tmdbId,
                  },
                },
              },
              {
                rank: 3,
                id: 3,
                listed_at: new Date().toISOString(),
                type: 'season',
                show: {
                  title: Data.tvShow.title,
                  year: parseISO(Data.tvShow.releaseDate).getFullYear(),
                  ids: {
                    slug: Data.tvShow.slug,
                    tmdb: Data.tvShow.tmdbId,
                  },
                },
                season: {
                  number: Data.season.seasonNumber,
                  title: Data.season.title,
                  ids: {
                    tmdb: Data.season.tmdbId,
                  },
                },
              },
              {
                rank: 4,
                id: 4,
                listed_at: new Date().toISOString(),
                type: 'episode',
                show: {
                  title: Data.tvShow.title,
                  year: parseISO(Data.tvShow.releaseDate).getFullYear(),
                  ids: {
                    slug: Data.tvShow.slug,
                    tmdb: Data.tvShow.tmdbId,
                  },
                },
                episode: {
                  season: Data.episode.seasonNumber,
                  number: Data.episode.episodeNumber,
                  title: Data.episode.title,
                  ids: {
                    tmdb: Data.episode.tmdbId,
                  },
                },
              },
            ],
          },
          'https://api.trakt.tv/sync/history': {
            1: {
              status: 200,
              data: [
                {
                  id: 1,
                  watched_at: new Date().toISOString(),
                  action: 'watch',
                  type: 'movie',
                  movie: {
                    title: Data.movie.title,
                    year: parseISO(Data.movie.releaseDate).getFullYear(),
                    ids: {
                      slug: Data.movie.slug,
                      tmdb: Data.movie.tmdbId,
                    },
                  },
                },
              ],
              headers: {
                'x-pagination-page-count': 2,
                'x-pagination-page': 1,
                'x-pagination-limit': 1,
              },
            },
            2: {
              status: 200,
              data: [
                {
                  id: 2,
                  watched_at: new Date().toISOString(),
                  action: 'watch',
                  type: 'episode',
                  show: {
                    title: Data.tvShow.title,
                    year: parseISO(Data.tvShow.releaseDate).getFullYear(),
                    ids: {
                      slug: Data.tvShow.slug,
                      tmdb: Data.tvShow.tmdbId,
                    },
                  },
                  episode: {
                    season: Data.episode.seasonNumber,
                    number: Data.episode.episodeNumber,
                    title: Data.episode.title,
                    ids: {
                      tmdb: Data.episode.tmdbId,
                    },
                  },
                },
              ],
              headers: {
                'x-pagination-page-count': 2,
                'x-pagination-page': 2,
                'x-pagination-limit': 1,
              },
            },
          }[(data as { page: number })?.page],
          'https://api.trakt.tv/sync/ratings': {
            status: 200,
            data: [
              {
                rating: 1,
                rated_at: new Date().toISOString(),
                type: 'movie',
                movie: {
                  title: Data.movie.title,
                  year: parseISO(Data.movie.releaseDate).getFullYear(),
                  ids: {
                    slug: Data.movie.slug,
                    tmdb: Data.movie.tmdbId,
                  },
                },
              },
              {
                rating: 5,
                rated_at: new Date().toISOString(),
                type: 'show',
                show: {
                  title: Data.tvShow.title,
                  year: parseISO(Data.tvShow.releaseDate).getFullYear(),
                  ids: {
                    slug: Data.tvShow.slug,
                    tmdb: Data.tvShow.tmdbId,
                  },
                },
              },
              {
                rating: 2,
                rated_at: new Date().toISOString(),
                type: 'season',
                show: {
                  title: Data.tvShow.title,
                  year: parseISO(Data.tvShow.releaseDate).getFullYear(),
                  ids: {
                    slug: Data.tvShow.slug,
                    tmdb: Data.tvShow.tmdbId,
                  },
                },
                season: {
                  number: Data.season.seasonNumber,
                  title: Data.season.title,
                  ids: {
                    tmdb: Data.season.tmdbId,
                  },
                },
              },
              {
                rating: 8,
                rated_at: new Date().toISOString(),
                type: 'episode',
                show: {
                  title: Data.tvShow.title,
                  year: parseISO(Data.tvShow.releaseDate).getFullYear(),
                  ids: {
                    slug: Data.tvShow.slug,
                    tmdb: Data.tvShow.tmdbId,
                  },
                },
                episode: {
                  season: Data.episode.seasonNumber,
                  number: Data.episode.episodeNumber,
                  title: Data.episode.title,
                  ids: {
                    tmdb: Data.episode.tmdbId,
                  },
                },
              },
            ],
          },
          'https://api.trakt.tv/users/me/lists': { status: 200, data: [] },
          'https://api.trakt.tv/users/me/lists/test/items': {
            status: 200,
            data: [],
          },
        }[url])
    );

    const getUserCodeResponse = await request(
      traktTvImportController.getUserCode,
      {
        userId: Data.user.id,
      }
    );

    await new Promise<void>((resolve) => setTimeout(resolve, 2000));

    expect(getUserCodeResponse.data).toEqual({
      userCode: '12345678',
      verificationUrl: 'https://trakt.tv/activate',
    });

    const getStateResponse = await request(traktTvImportController.state, {
      userId: Data.user.id,
    });

    expect(getStateResponse.data).toMatchObject({
      state: 'imported',
      exportSummary: {
        watchlist: { movies: 1, shows: 1, seasons: 1, episodes: 1 },
        seen: { movies: 1, episodes: 1 },
        ratings: { movies: 1, shows: 1, seasons: 1, episodes: 1 },
      },
      importSummary: {
        watchlist: { movies: 1, shows: 1, seasons: 1, episodes: 1 },
        seen: { movies: 1, episodes: 1 },
        ratings: { movies: 1, shows: 1, seasons: 1, episodes: 1 },
      },
    });
  });
});
