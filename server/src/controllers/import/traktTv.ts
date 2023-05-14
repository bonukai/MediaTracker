import Express from 'express';
import _ from 'lodash';

import { MediaItemBaseWithSeasons, MediaType } from 'src/entity/mediaItem';
import { Seen } from 'src/entity/seen';
import { UserRating } from 'src/entity/userRating';
import { TraktApi, TraktTvExport } from 'src/export/trakttv';
import { findMediaItemByExternalIdInExternalSources } from 'src/metadata/findByExternalId';
import { listRepository } from 'src/repository/list';
import { listItemRepository } from 'src/repository/listItemRepository';
import { mediaItemRepository } from 'src/repository/mediaItem';
import { seenRepository } from 'src/repository/seen';
import { userRatingRepository } from 'src/repository/userRating';
import { updateMediaItem } from 'src/updateMetadata';
import { inArray } from 'src/utils';
import { createExpressRoute } from 'typescript-routes-to-openapi-server';

type ImportState =
  | 'uninitialized'
  | 'waiting-for-authentication'
  | 'exporting'
  | 'updating-metadata'
  | 'importing'
  | 'imported'
  | 'error';

type TraktTvImportSummary = {
  watchlist: {
    movies: number;
    shows: number;
    seasons: number;
    episodes: number;
  };
  seen: {
    movies: number;
    episodes: number;
  };
  ratings: {
    movies: number;
    shows: number;
    seasons: number;
    episodes: number;
  };
  lists: {
    listName: string;
    listId: string;
    movies: number;
    shows: number;
    seasons: number;
    episodes: number;
  }[];
};

type TraktTvNotImportedMovie = {
  title: string;
  year: number;
  traktTvLink: string;
};

type TraktTvNotImportedTvShow = {
  title: string;
  year: number;
  traktTvLink: string;
};

type TraktTvNotImportedSeason = {
  show: {
    title: string;
    year: number;
  };
  season: {
    seasonNumber: number;
  };
  traktTvLink: string;
};

type TraktTvNotImportedEpisode = {
  show: {
    title: string;
    year: number;
  };
  episode: {
    episodeNumber: number;
    seasonNumber: number;
  };
  traktTvLink: string;
};

type TraktTvImportNotImportedItems = {
  watchlist: {
    movies?: TraktTvNotImportedMovie[];
    shows?: TraktTvNotImportedTvShow[];
    seasons?: TraktTvNotImportedSeason[];
    episodes?: TraktTvNotImportedEpisode[];
  };
  seen: {
    movies?: TraktTvNotImportedMovie[];
    episodes?: TraktTvNotImportedEpisode[];
  };
  ratings: {
    movies?: TraktTvNotImportedMovie[];
    shows?: TraktTvNotImportedTvShow[];
    seasons?: TraktTvNotImportedSeason[];
    episodes?: TraktTvNotImportedEpisode[];
  };
  lists: {
    listName: string;
    listId: string;
    movies?: TraktTvNotImportedMovie[];
    shows?: TraktTvNotImportedTvShow[];
    seasons?: TraktTvNotImportedSeason[];
    episodes?: TraktTvNotImportedEpisode[];
  }[];
};

/**
 * @openapi_tags TraktTvImport
 */
export class TraktTvImportController {
  private readonly importState = new Map<
    number,
    {
      state: ImportState;
      deviceCode?: Awaited<
        ReturnType<typeof TraktTvExport.prototype.authenticate>
      >;
      exportSummary?: TraktTvImportSummary;
      importSummary?: TraktTvImportSummary;
      notImportedItems?: TraktTvImportNotImportedItems;
      progress?: number;
      error?: string;
      clients: Array<Express.Response>;
    }
  >();

  private updateState(args: {
    userId: number;
    state: ImportState;
    deviceCode?: Awaited<
      ReturnType<typeof TraktTvExport.prototype.authenticate>
    >;
    exportSummary?: TraktTvImportSummary;
    importSummary?: TraktTvImportSummary;
    notImportedItems?: TraktTvImportNotImportedItems;
    progress?: number;
    error?: string;
  }) {
    const currentState = this.importState.get(args.userId);

    const newState = {
      state: args.state,
      progress: args.progress,
      error: args.error,
      exportSummary: args.exportSummary || currentState.exportSummary,
      importSummary: args.importSummary || currentState.importSummary,
      notImportedItems: args.notImportedItems || currentState.notImportedItems,
      deviceCode: args.deviceCode || currentState.deviceCode,
    };

    this.importState.set(args.userId, {
      ...newState,
      clients: currentState.clients,
    });

    currentState.clients.forEach((client) => {
      client.write(`data: ${JSON.stringify(newState)}\n\n`);
    });
  }

  private addClient(args: { userId: number; client: Express.Response }) {
    const currentState = this.importState.get(args.userId);

    if (!currentState) {
      throw new Error(`No import state for userId ${args.userId}`);
    }

    this.importState.set(args.userId, {
      ...currentState,
      clients: [...currentState.clients, args.client],
    });
  }

  private initState(args: { userId: number }) {
    this.importState.set(args.userId, {
      state: 'uninitialized',
      clients: [],
    });
  }

  /**
   * @openapi_operationId state
   */
  state = createExpressRoute<{
    method: 'get';
    path: '/api/import-trakttv/state';
    responseBody: {
      state: ImportState;
      progress?: number;
      exportSummary?: TraktTvImportSummary;
      importSummary?: TraktTvImportSummary;
      notImportedItems?: TraktTvImportNotImportedItems;
      error?: string;
    };
  }>(async (req, res) => {
    const userId = Number(req.user);

    if (!this.importState.has(userId)) {
      this.initState({ userId });
    }

    const importState = this.importState.get(userId);

    res.send({
      state: importState.state,
      progress: importState.progress,
      exportSummary: importState.exportSummary,
      importSummary: importState.importSummary,
      notImportedItems: importState.notImportedItems,
      error: importState.error,
    });
  });

  /**
   * @openapi_operationId state-stream
   */
  stateStream = createExpressRoute<{
    method: 'get';
    path: '/api/import-trakttv/state-stream';
    responseBody: {
      state: ImportState;
      progress?: number;
      exportSummary?: TraktTvImportSummary;
      importSummary?: TraktTvImportSummary;
      notImportedItems?: TraktTvImportNotImportedItems;
      error?: string;
    };
  }>(async (req, res) => {
    const userId = Number(req.user);

    if (!this.importState.has(userId)) {
      this.initState({ userId });
    }

    const importState = this.importState.get(userId);

    const state = {
      state: importState.state,
      progress: importState.progress,
      exportSummary: importState.exportSummary,
      importSummary: importState.importSummary,
      notImportedItems: importState.notImportedItems,
      error: importState.error,
    };

    if (req.accepts('text/event-stream')) {
      res.writeHead(200, {
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream',
      });

      res.write(`data: ${JSON.stringify(state)}\n\n`);

      this.addClient({ userId: userId, client: res });
    } else {
      res.send(state);
    }
  });

  /**
   * @openapi_operationId deviceToken
   */
  getUserCode = createExpressRoute<{
    method: 'get';
    path: '/api/import-trakttv/device-token';
    responseBody: {
      userCode: string;
      verificationUrl: string;
    };
  }>(async (req, res) => {
    const userId = Number(req.user);

    if (!this.importState.has(userId)) {
      this.initState({ userId: userId });
    }

    const importState = this.importState.get(userId);

    if (
      importState.state === 'uninitialized' ||
      (importState.deviceCode?.expiresAt <= new Date() &&
        !importState.exportSummary)
    ) {
      const traktTvImport = new TraktTvExport();

      const deviceCode = await traktTvImport.authenticate(async (userCode) => {
        try {
          if (userCode !== this.importState.get(userId)?.deviceCode?.userCode) {
            return;
          }

          this.updateState({ userId: userId, state: 'exporting' });

          const exportedData = await traktTvImport.export();

          this.updateState({
            userId: userId,
            state: 'updating-metadata',
            exportSummary: getExportedSummery(exportedData),
            progress: undefined,
          });

          const { movieMetadata, tvShowMetadata } =
            await updateMetadataForTraktTvImport(exportedData, (progress) => {
              this.updateState({
                userId: userId,
                state: 'updating-metadata',
                progress: progress,
              });
            });

          this.updateState({
            userId: userId,
            state: 'importing',
            notImportedItems: getNotImportedItems(
              exportedData,
              movieMetadata,
              tvShowMetadata
            ),
            progress: 0,
          });

          const incrementImportingStep = () => {
            let step = 0;
            const numberOfSteps = 8;
            return () => {
              step++;

              this.updateState({
                userId: userId,
                state: 'importing',
                progress: step / numberOfSteps,
              });
            };
          };

          const watchlistMovies = exportedData.watchlist
            .filter(traktTvMovieFilter)
            .map(movieMetadata)
            .filter(Boolean)
            .map(({ mediaItem }) => ({
              mediaItemId: mediaItem.id,
            }));

          const watchlistTvShows = exportedData.watchlist
            .filter(traktTvShowFilter)
            .map(tvShowMetadata)
            .filter(Boolean)
            .map(({ mediaItem }) => ({
              mediaItemId: mediaItem.id,
            }));

          const watchlistSeasons = exportedData.watchlist
            .filter(traktTvSeasonFilter)
            .map(tvShowMetadata)
            .filter(Boolean)
            .map(withSeason)
            .filter(Boolean)
            .map(({ mediaItem, season }) => ({
              mediaItemId: mediaItem.id,
              seasonId: season.id,
            }));

          const watchlistEpisodes = exportedData.watchlist
            .filter(traktTvEpisodeFilter)
            .map(tvShowMetadata)
            .filter(Boolean)
            .map(withEpisode)
            .filter(Boolean)
            .map(({ mediaItem, episode }) => ({
              mediaItemId: mediaItem.id,
              episodeId: episode.id,
            }));

          const seenMovies = exportedData.history
            .filter(traktTvMovieFilter)
            .map(movieMetadata)
            .filter(Boolean)
            .map(
              ({ mediaItem, item }): Seen => ({
                userId: userId,
                mediaItemId: mediaItem.id,
                date: new Date(item.watched_at).getTime(),
              })
            );

          const seenEpisodes = exportedData.history
            .filter(traktTvEpisodeFilter)
            .map(tvShowMetadata)
            .filter(Boolean)
            .map(withEpisode)
            .filter(Boolean)
            .map(
              ({ mediaItem, item, episode }): Seen => ({
                userId: userId,
                mediaItemId: mediaItem.id,
                date: new Date(item.watched_at).getTime(),
                episodeId: episode.id,
              })
            )
            .filter(Boolean);

          const ratedMovies = exportedData.rating
            .filter(traktTvMovieFilter)
            .map(movieMetadata)
            .filter(Boolean)
            .map(
              ({ mediaItem, item }): UserRating => ({
                userId: userId,
                mediaItemId: mediaItem.id,
                rating: item.rating / 2,
                date: new Date(item.rated_at).getTime(),
              })
            );

          const ratedTvShows = exportedData.rating
            .filter((item) => item.show && !item.season && !item.episode)
            .map(tvShowMetadata)
            .filter(Boolean)
            .map(
              ({ mediaItem, item }): UserRating => ({
                userId: userId,
                mediaItemId: mediaItem.id,
                rating: item.rating / 2,
                date: new Date(item.rated_at).getTime(),
              })
            );

          const ratedSeasons = exportedData.rating
            .filter(traktTvSeasonFilter)
            .map(tvShowMetadata)
            .filter(Boolean)
            .map(withSeason)
            .filter(Boolean)
            .map(
              ({ mediaItem, item, season }): UserRating => ({
                userId: userId,
                mediaItemId: mediaItem.id,
                rating: item.rating / 2,
                date: new Date(item.rated_at).getTime(),
                seasonId: season.id,
              })
            )
            .filter(Boolean);

          const ratedEpisodes = exportedData.rating
            .filter(traktTvEpisodeFilter)
            .map(tvShowMetadata)
            .filter(Boolean)
            .map(withEpisode)
            .filter(Boolean)
            .map(
              ({ mediaItem, item, episode }): UserRating => ({
                userId: userId,
                mediaItemId: mediaItem.id,
                rating: item.rating / 2,
                date: new Date(item.rated_at).getTime(),
                episodeId: episode.id,
              })
            )
            .filter(Boolean);

          for (const item of [
            ...watchlistMovies,
            ...watchlistTvShows,
            ...watchlistSeasons,
            ...watchlistEpisodes,
          ] as {
            mediaItemId: number;
            seasonId?: number;
            episodeId?: number;
          }[]) {
            await listItemRepository.addItem({
              userId: userId,
              watchlist: true,
              mediaItemId: item.mediaItemId,
              seasonId: item.seasonId || undefined,
              episodeId: item.episodeId || undefined,
            });
          }

          const lists = exportedData.lists.map((traktList) => {
            const listItems =
              exportedData.listsItems.get(traktList.ids.slug) || [];

            return {
              name: traktList.name,
              traktId: traktList.ids.trakt,
              traktSlug: traktList.ids.slug,
              description: traktList.description,
              privacy: traktList.privacy,
              sortBy: traktList.sort_by,
              sortOrder: traktList.sort_how,
              movies: listItems
                .filter(traktTvMovieFilter)
                .map(movieMetadata)
                .filter(Boolean)
                .map(({ mediaItem }) => ({
                  mediaItemId: mediaItem.id,
                })),
              shows: listItems
                .filter(traktTvShowFilter)
                .map(tvShowMetadata)
                .filter(Boolean)
                .map(({ mediaItem }) => ({
                  mediaItemId: mediaItem.id,
                })),
              seasons: listItems
                .filter(traktTvSeasonFilter)
                .map(tvShowMetadata)
                .filter(Boolean)
                .map(withSeason)
                .filter(Boolean)
                .map(({ mediaItem, season }) => ({
                  mediaItemId: mediaItem.id,
                  seasonId: season.id,
                })),
              episodes: listItems
                .filter(traktTvEpisodeFilter)
                .map(tvShowMetadata)
                .filter(Boolean)
                .map(withEpisode)
                .filter(Boolean)
                .map(({ mediaItem, episode }) => ({
                  mediaItemId: mediaItem.id,
                  episodeId: episode.id,
                })),
            };
          });

          incrementImportingStep();

          for (const list of lists) {
            const mediaTrackerListName = `TraktTv-${list.name}`;

            const mediaTrackerList =
              (await listRepository.findOne({
                traktId: list.traktId,
              })) ||
              (await listRepository.findOne({
                name: mediaTrackerListName,
              })) ||
              (await listRepository.create({
                name: mediaTrackerListName,
                traktId: list.traktId,
                userId: userId,
                description: list.description,
                privacy: list.privacy,
                sortBy: list.sortBy,
                sortOrder: list.sortOrder,
              }));

            await listItemRepository.addManyItems({
              listId: mediaTrackerList.id,
              userId: userId,
              listItems: [
                ...list.movies,
                ...list.shows,
                ...list.seasons,
                ...list.episodes,
              ],
            });
          }

          const uniqBy = (seen: Seen) => {
            return {
              userId: seen.userId,
              mediaItemId: seen.mediaItemId,
              episodeId: seen.episodeId || null,
              date: seen.date || null,
            };
          };

          incrementImportingStep();

          await seenRepository.createManyUnique(seenMovies, uniqBy, {
            userId: userId,
          });
          incrementImportingStep();

          await seenRepository.createManyUnique(seenEpisodes, uniqBy, {
            userId: userId,
          });

          incrementImportingStep();
          await userRatingRepository.createMany(ratedMovies);
          incrementImportingStep();
          await userRatingRepository.createMany(ratedTvShows);
          incrementImportingStep();
          await userRatingRepository.createMany(ratedSeasons);
          incrementImportingStep();
          await userRatingRepository.createMany(ratedEpisodes);

          this.updateState({
            userId: userId,
            state: 'imported',
            importSummary: {
              watchlist: {
                movies: watchlistMovies.length,
                shows: watchlistTvShows.length,
                seasons: watchlistSeasons.length,
                episodes: watchlistEpisodes.length,
              },
              seen: {
                movies: seenMovies.length,
                episodes: seenEpisodes.length,
              },
              ratings: {
                movies: ratedMovies.length,
                shows: ratedTvShows.length,
                seasons: ratedSeasons.length,
                episodes: ratedEpisodes.length,
              },
              lists: lists.map((list) => ({
                listName: list.name,
                listId: list.traktSlug,
                movies: list.movies.length,
                shows: list.shows.length,
                seasons: list.seasons.length,
                episodes: list.episodes.length,
              })),
            },
          });
        } catch (error) {
          this.updateState({
            userId: userId,
            state: 'error',
            error: String(error),
          });
        }
      });

      this.updateState({
        userId: userId,
        state: 'waiting-for-authentication',
        deviceCode: deviceCode,
      });

      res.send({
        userCode: deviceCode.userCode,
        verificationUrl: deviceCode.verificationUrl,
      });
    } else {
      res.send({
        userCode: importState.deviceCode.userCode,
        verificationUrl: importState.deviceCode.verificationUrl,
      });
    }
  });

  /**
   * @openapi_operationId startOver
   */
  startOver = createExpressRoute<{
    method: 'get';
    path: '/api/import-trakttv/start-over';
  }>(async (req, res) => {
    const userId = Number(req.user);

    const importState = this.importState.get(userId);

    if (importState) {
      if (
        inArray(importState.state, [
          'exporting',
          'importing',
          'updating-metadata',
          'uninitialized',
        ])
      ) {
        res.sendStatus(400);
        return;
      }

      this.importState.set(userId, {
        state: 'uninitialized',
        clients: importState.clients,
      });
    }

    res.send();
  });
}

const findEpisodeOrSeason = (args: {
  mediaItem: MediaItemBaseWithSeasons;
  seasonNumber: number;
  episodeNumber?: number;
}) => {
  const { mediaItem, seasonNumber, episodeNumber } = args;

  const season = mediaItem?.seasons?.find(
    (season) => season.seasonNumber === seasonNumber
  );

  const episode = episodeNumber
    ? season?.episodes?.find(
        (episode) => episode.episodeNumber === episodeNumber
      )
    : undefined;

  return {
    season: season,
    episode: episode,
  };
};

const getMediaItemsByTmdbIds = async (
  ids: {
    trakt: number;
    tvdb: number;
    imdb: string;
    tmdb: number;
    tvrage: number;
  }[],
  mediaType: MediaType
) => {
  const existingItems: MediaItemBaseWithSeasons[] =
    await mediaItemRepository.findByExternalIds({
      tmdbId: ids.map((item) => item.tmdb).filter(Boolean),
      imdbId: ids.map((item) => item.imdb).filter(Boolean),
      tvdbId: ids.map((item) => item.tvdb).filter(Boolean),
      traktId: ids.map((item) => item.trakt).filter(Boolean),
      mediaType: mediaType,
    });

  const existingItemsMapByTmdbId: _.Dictionary<MediaItemBaseWithSeasons> =
    _.keyBy(existingItems, (mediaItem) => mediaItem.tmdbId);

  const missingItems = _(ids)
    .filter((item) => !existingItemsMapByTmdbId[item.tmdb])
    .uniqBy((item) => item.trakt)
    .value();

  await Promise.all(
    existingItems
      .filter((item) => item.mediaType === 'tv')
      .map(async (item) => {
        item.seasons = await mediaItemRepository.seasonsWithEpisodes(item);
      })
      .map(errorHandler)
  );

  return {
    existingItems: existingItems,
    missingItems: missingItems,
  };
};

const errorHandler = async <T>(promise: Promise<T>): Promise<T> => {
  try {
    return await promise;
  } catch (error) {
    return null;
  }
};

const updateMetadataForTraktTvImport = async (
  exportedData: Awaited<ReturnType<typeof TraktTvExport.prototype.export>>,
  onProgress: (progress: number) => void
) => {
  const listItems = _.flatten(Array.from(exportedData.listsItems.values()));

  const movies = await getMediaItemsByTmdbIds(
    _.uniq(
      [
        ...exportedData.watchlist,
        ...exportedData.history,
        ...exportedData.rating,
        ...listItems,
      ]
        .filter((item) => item.type === 'movie')
        .map((item) => item.movie.ids)
    ),
    'movie'
  );

  const tvShows = await getMediaItemsByTmdbIds(
    _.uniq(
      [
        ...exportedData.watchlist,
        ...exportedData.history,
        ...exportedData.rating,
        ...listItems,
      ]
        .filter(
          (item) =>
            item.type === 'show' ||
            item.type === 'season' ||
            item.type === 'episode'
        )
        .map((item) => item.show.ids)
    ),
    'tv'
  );

  const tvShowsToUpdate = tvShows.existingItems.filter(
    (item) => item.needsDetails
  );

  const total =
    movies.missingItems.length +
    tvShows.missingItems.length +
    tvShowsToUpdate.length;

  let currentItem = 0;

  const updateProgress = () => {
    currentItem++;
    onProgress(currentItem / total);
  };

  const foundMovies = new Array<MediaItemBaseWithSeasons>();

  for (const item of movies.missingItems) {
    try {
      foundMovies.push(
        await findMediaItemByExternalIdInExternalSources({
          id: {
            traktId: item.trakt,
            imdbId: item.imdb,
            tmdbId: item.tmdb,
            tvdbId: item.tvdb,
          },
          mediaType: 'movie',
        })
      );
      updateProgress();
    } catch (error) {
      //
    }
  }

  const foundTvShows = new Array<MediaItemBaseWithSeasons>();

  for (const item of tvShows.missingItems) {
    try {
      foundTvShows.push(
        await findMediaItemByExternalIdInExternalSources({
          id: {
            traktId: item.trakt,
            imdbId: item.imdb,
            tmdbId: item.tmdb,
            tvdbId: item.tvdb,
          },
          mediaType: 'tv',
        })
      );
      updateProgress();
    } catch (error) {
      //
    }
  }

  const updatedTvShows = new Array<MediaItemBaseWithSeasons>();

  for (const mediaItem of tvShowsToUpdate) {
    try {
      updatedTvShows.push(await updateMediaItem(mediaItem));
      updateProgress();
    } catch (error) {
      //
    }
  }

  const mediaItemsMap = _.keyBy(
    [
      ...movies.existingItems,
      ...foundMovies.filter(Boolean),
      ..._.uniqBy(
        [...updatedTvShows, ...tvShows.existingItems],
        (item) => item.id
      ),
      ...foundTvShows.filter(Boolean),
    ],
    (mediaItem) => mediaItem.tmdbId
  );

  return createMetadataFunctions(mediaItemsMap);
};

const withEpisode = <
  T extends {
    episode?: {
      season: number;
      number: number;
    };
  }
>({
  mediaItem,
  item,
}: {
  mediaItem: MediaItemBaseWithSeasons;
  item: T;
}) => {
  const res = findEpisodeOrSeason({
    mediaItem: mediaItem,
    seasonNumber: item.episode?.season,
    episodeNumber: item.episode?.number,
  });

  if (!res?.episode) {
    return;
  }

  return { mediaItem, item, episode: res.episode };
};

const withSeason = <
  T extends {
    season?: {
      number: number;
    };
  }
>({
  mediaItem,
  item,
}: {
  mediaItem: MediaItemBaseWithSeasons;
  item: T;
}) => {
  const res = findEpisodeOrSeason({
    mediaItem: mediaItem,
    seasonNumber: item.season?.number,
  });

  if (!res?.season) {
    return;
  }

  return { mediaItem, item, season: res.season };
};

const traktTvMovieFilter = (item: {
  episode?: TraktApi.EpisodeResponse;
  show?: TraktApi.ShowResponse;
  movie?: TraktApi.MovieResponse;
  season?: TraktApi.SeasonResponse;
}) => item.movie;

const traktTvShowFilter = (item: {
  episode?: TraktApi.EpisodeResponse;
  show?: TraktApi.ShowResponse;
  movie?: TraktApi.MovieResponse;
  season?: TraktApi.SeasonResponse;
}) => item.show && !item.season && !item.episode;

const traktTvSeasonFilter = (item: {
  episode?: TraktApi.EpisodeResponse;
  show?: TraktApi.ShowResponse;
  movie?: TraktApi.MovieResponse;
  season?: TraktApi.SeasonResponse;
}) => item.show && item.season && !item.episode;

const traktTvEpisodeFilter = (item: {
  episode?: TraktApi.EpisodeResponse;
  show?: TraktApi.ShowResponse;
  movie?: TraktApi.MovieResponse;
  season?: TraktApi.SeasonResponse;
}) => item.show && !item.season && item.episode;

const getExportedSummery = (
  exportedData: Awaited<ReturnType<TraktTvExport['export']>>
) => {
  return {
    watchlist: {
      movies: exportedData.watchlist.filter(traktTvMovieFilter).length,
      shows: exportedData.watchlist.filter(traktTvShowFilter).length,
      seasons: exportedData.watchlist.filter(traktTvSeasonFilter).length,
      episodes: exportedData.watchlist.filter(traktTvEpisodeFilter).length,
    },
    seen: {
      movies: exportedData.history.filter(traktTvMovieFilter).length,
      episodes: exportedData.history.filter(traktTvEpisodeFilter).length,
    },
    ratings: {
      movies: exportedData.rating.filter(traktTvMovieFilter).length,
      shows: exportedData.rating.filter(
        (item) => item.show && !item.season && !item.episode
      ).length,
      seasons: exportedData.rating.filter(traktTvSeasonFilter).length,
      episodes: exportedData.rating.filter(traktTvEpisodeFilter).length,
    },
    lists: exportedData.lists.map((list) => {
      const listItems = exportedData.listsItems.get(list.ids.slug);

      return {
        listName: list.name,
        listId: list.ids.slug,
        movies: listItems?.filter(traktTvMovieFilter)?.length || 0,
        shows: listItems?.filter(traktTvShowFilter)?.length || 0,
        seasons: listItems?.filter(traktTvSeasonFilter)?.length || 0,
        episodes: listItems?.filter(traktTvEpisodeFilter)?.length || 0,
      };
    }),
  };
};

type TraktTvItem = {
  episode?: TraktApi.EpisodeResponse;
  show?: TraktApi.ShowResponse;
  movie?: TraktApi.MovieResponse;
  season?: TraktApi.SeasonResponse;
};

const createMetadataFunctions = (
  mediaItemsMap: _.Dictionary<MediaItemBaseWithSeasons>
) => {
  const movieMetadata = <
    T extends {
      movie?: TraktApi.MovieResponse;
    }
  >(
    item: T
  ) => {
    const res = mediaItemsMap[item.movie?.ids?.tmdb];

    if (res) {
      return {
        mediaItem: res,
        item,
      };
    }
  };

  const tvShowMetadata = <
    T extends {
      show?: TraktApi.ShowResponse;
    }
  >(
    item: T
  ) => {
    const res = mediaItemsMap[item.show?.ids?.tmdb];

    if (res) {
      return {
        mediaItem: res,
        item,
      };
    }
  };

  return {
    movieMetadata,
    tvShowMetadata,
  };
};

const getNotImportedItems = (
  exportedData: Awaited<ReturnType<TraktTvExport['export']>>,
  movieMetadata: <
    T extends {
      movie?: TraktApi.MovieResponse;
    }
  >(
    item: T
  ) => {
    mediaItem: MediaItemBaseWithSeasons;
    item: T;
  },
  tvShowMetadata: <
    T extends {
      show?: TraktApi.ShowResponse;
    }
  >(
    item: T
  ) => {
    mediaItem: MediaItemBaseWithSeasons;
    item: T;
  }
): TraktTvImportNotImportedItems => {
  const not = <T, U>(f: (args: T) => U) => {
    return (args: T) => !f(args);
  };

  const filterSeasonsWithoutMetadata = (item: TraktTvItem) => {
    if (!traktTvSeasonFilter(item)) {
      return false;
    }

    const show = tvShowMetadata(item);

    if (!show) {
      return true;
    }

    return !withSeason(show);
  };

  const filterEpisodesWithoutMetadata = (item: TraktTvItem) => {
    if (!traktTvEpisodeFilter(item)) {
      return false;
    }

    const show = tvShowMetadata(item);

    if (!show) {
      return true;
    }

    return !withEpisode(show);
  };

  const mapMovie = (item: TraktTvItem) => ({
    title: item.movie.title,
    year: item.movie.year,
    traktTvLink: `https://trakt.tv/movies/${item.movie.ids.slug}`,
  });

  const mapTvShow = (item: TraktTvItem) => ({
    title: item.show.title,
    year: item.show.year,
    traktTvLink: `https://trakt.tv/shows/${item.show.ids.slug}`,
  });

  const mapSeason = (item: TraktTvItem) => {
    return {
      show: {
        title: item.show.title,
        year: item.show.year,
      },
      season: {
        seasonNumber: item.season?.number,
      },
      traktTvLink: `https://trakt.tv/shows/${item.show.ids.slug}/seasons/${item.season.number}`,
    };
  };

  const mapEpisode = (item: TraktTvItem) => {
    return {
      show: {
        title: item.show.title,
        year: item.show.year,
      },
      episode: {
        episodeNumber: item.episode.number,
        seasonNumber: item.episode.season,
      },
      traktTvLink: `https://trakt.tv/shows/${item.show.ids.slug}/seasons/${item.episode.season}/episodes/${item.episode.number}`,
    };
  };

  return {
    watchlist: {
      movies: exportedData.watchlist
        .filter(traktTvMovieFilter)
        .filter(not(movieMetadata))
        .map(mapMovie),
      shows: exportedData.watchlist
        .filter(traktTvShowFilter)
        .filter(not(tvShowMetadata))
        .map(mapTvShow),
      seasons: exportedData.watchlist
        .filter(filterSeasonsWithoutMetadata)
        .map(mapSeason),
      episodes: exportedData.watchlist
        .filter(filterEpisodesWithoutMetadata)
        .map(mapEpisode),
    },
    seen: {
      movies: exportedData.history
        .filter(traktTvMovieFilter)
        .filter(not(movieMetadata))
        .map(mapMovie),
      episodes: exportedData.history
        .filter(filterEpisodesWithoutMetadata)
        .map(mapEpisode),
    },
    ratings: {
      movies: exportedData.rating
        .filter(traktTvMovieFilter)
        .filter(not(movieMetadata))
        .map(mapMovie),
      shows: exportedData.rating
        .filter((item) => item.show && !item.season && !item.episode)
        .filter(not(tvShowMetadata))
        .map(mapTvShow),
      seasons: exportedData.rating
        .filter(filterSeasonsWithoutMetadata)
        .map(mapSeason),
      episodes: exportedData.rating
        .filter(filterEpisodesWithoutMetadata)
        .map(mapEpisode),
    },
    lists: exportedData.lists
      .map((list) => {
        const listItems = exportedData.listsItems.get(list.ids.slug);

        return {
          listName: list.name,
          listId: list.ids.slug,
          movies: listItems
            ?.filter(traktTvMovieFilter)
            ?.filter(not(movieMetadata))
            .map(mapMovie),
          shows: listItems
            ?.filter(traktTvShowFilter)
            ?.filter(not(tvShowMetadata))
            .map(mapTvShow),
          seasons: listItems
            ?.filter(filterSeasonsWithoutMetadata)
            ?.map(mapSeason),
          episodes: listItems
            ?.filter(filterEpisodesWithoutMetadata)
            ?.map(mapEpisode),
        };
      })
      .filter(
        (list) =>
          list.movies?.length > 0 ||
          list.shows?.length > 0 ||
          list.seasons?.length > 0 ||
          list.episodes?.length > 0
      ),
  };
};
