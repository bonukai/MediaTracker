import Express from 'express';
import _ from 'lodash';

import { MediaItemBaseWithSeasons, MediaType } from 'src/entity/mediaItem';
import { Seen } from 'src/entity/seen';
import { UserRating } from 'src/entity/userRating';
import { TraktApi, TraktTvExport } from 'src/export/trakttv';
import { MetadataProvider } from 'src/metadata/metadataProvider';
import { metadataProviders } from 'src/metadata/metadataProviders';
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
            exportSummary: {
              watchlist: {
                movies:
                  exportedData.watchlist.filter(traktTvMovieFilter).length,
                shows: exportedData.watchlist.filter(traktTvShowFilter).length,
                seasons:
                  exportedData.watchlist.filter(traktTvSeasonFilter).length,
                episodes:
                  exportedData.watchlist.filter(traktTvEpisodeFilter).length,
              },
              seen: {
                movies: exportedData.history.filter(traktTvMovieFilter).length,
                episodes:
                  exportedData.history.filter(traktTvEpisodeFilter).length,
              },
              ratings: {
                movies: exportedData.rating.filter(traktTvMovieFilter).length,
                shows: exportedData.rating.filter(
                  (item) => item.show && !item.season && !item.episode
                ).length,
                seasons: exportedData.rating.filter(traktTvSeasonFilter).length,
                episodes:
                  exportedData.rating.filter(traktTvEpisodeFilter).length,
              },
              lists: exportedData.lists.map((list) => {
                const listItems = exportedData.listsItems.get(list.ids.slug);

                return {
                  listName: list.name,
                  listId: list.ids.slug,
                  movies: listItems?.filter(traktTvMovieFilter)?.length || 0,
                  shows: listItems?.filter(traktTvShowFilter)?.length || 0,
                  seasons: listItems?.filter(traktTvSeasonFilter)?.length || 0,
                  episodes:
                    listItems?.filter(traktTvEpisodeFilter)?.length || 0,
                };
              }),
            },
            progress: undefined,
          });

          const mediaItemsMap = await updateMetadataForTraktTvImport(
            exportedData,
            (progress) => {
              this.updateState({
                userId: userId,
                state: 'updating-metadata',
                progress: progress,
              });
            }
          );

          this.updateState({
            userId: userId,
            state: 'importing',
            progress: undefined,
          });

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
                type: 'seen',
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
                type: 'seen',
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

            for (const listItem of [
              ...list.movies,
              ...list.shows,
              ...list.seasons,
              ...list.episodes,
            ] as {
              mediaItemId: number;
              seasonId?: number;
              episodeId?: number;
            }[]) {
              await listItemRepository.addItem({
                listId: mediaTrackerList.id,
                userId: userId,
                mediaItemId: listItem.mediaItemId,
                seasonId: listItem.seasonId || undefined,
                episodeId: listItem.episodeId || undefined,
              });
            }
          }

          const uniqBy = (seen: Seen) => {
            return {
              userId: seen.userId,
              mediaItemId: seen.mediaItemId,
              episodeId: seen.episodeId || null,
              date: seen.date || null,
              type: seen.type,
              action: seen.action || null,
              progress: seen.progress || null,
            };
          };

          await seenRepository.createManyUnique(seenMovies, uniqBy, {
            userId: userId,
          });

          await seenRepository.createManyUnique(seenEpisodes, uniqBy, {
            userId: userId,
          });

          await userRatingRepository.createMany(ratedMovies);
          await userRatingRepository.createMany(ratedTvShows);
          await userRatingRepository.createMany(ratedSeasons);
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
  tmdbId: number[],
  mediaType: MediaType
) => {
  const existingItems: MediaItemBaseWithSeasons[] =
    await mediaItemRepository.findByExternalIds({
      tmdbId: tmdbId,
      mediaType: mediaType,
    });

  const existingItemsMapByTmdbId: _.Dictionary<MediaItemBaseWithSeasons> =
    _.keyBy(existingItems, (mediaItem) => mediaItem.tmdbId);

  const missingItems = tmdbId.filter(
    (tmdbId) => !existingItemsMapByTmdbId[tmdbId]
  );

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
        .map((item) => item.movie.ids.tmdb)
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
        .map((item) => item.show.ids.tmdb)
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

  const movieMetadataProvider = metadataProviders.get('movie');
  const tvShowMetadataProvider = metadataProviders.get('tv');

  const updateProgress = async <T>(promise: Promise<T>): Promise<T> => {
    const res = await promise;
    currentItem++;
    onProgress(currentItem / total);
    return res;
  };

  const foundMovies = (
    await Promise.all(
      movies.missingItems
        .map((tmdbId) =>
          errorHandler(findMediaItemFromTmdbId(tmdbId, movieMetadataProvider))
        )
        .map(updateProgress)
        .map(errorHandler)
    )
  ).filter(Boolean);

  const foundTvShows = (
    await Promise.all(
      tvShows.missingItems
        .map((tmdbId) =>
          errorHandler(findMediaItemFromTmdbId(tmdbId, tvShowMetadataProvider))
        )
        .map(updateProgress)
        .map(errorHandler)
    )
  ).filter(Boolean);

  const updatedTvShows = await Promise.all(
    tvShowsToUpdate.map(updateMediaItem).map(updateProgress).map(errorHandler)
  );

  return _.keyBy(
    [
      ...movies.existingItems,
      ...foundMovies,
      ..._.uniqBy(
        [...updatedTvShows, ...tvShows.existingItems],
        (item) => item.id
      ),
      ...foundTvShows,
    ],
    (mediaItem) => mediaItem.tmdbId
  );
};

const findMediaItemFromTmdbId = async (
  tmdbId: number,
  metadataProvider: MetadataProvider
) => {
  const item = await metadataProvider.findByTmdbId(tmdbId);

  if (item) {
    return await mediaItemRepository.create(item);
  }
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
