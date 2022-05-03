import _ from 'lodash';
import { ListItem } from 'src/entity/list';

import { MediaItemBaseWithSeasons, MediaType } from 'src/entity/mediaItem';
import { Seen } from 'src/entity/seen';
import { UserRating } from 'src/entity/userRating';
import { TraktApi, TraktTvExport } from 'src/export/trakttv';
import { MetadataProvider } from 'src/metadata/metadataProvider';
import { metadataProviders } from 'src/metadata/metadataProviders';
import { listItemRepository } from 'src/repository/listItemRepository';
import { mediaItemRepository } from 'src/repository/mediaItem';
import { seenRepository } from 'src/repository/seen';
import { userRatingRepository } from 'src/repository/userRating';
import { updateMediaItem } from 'src/updateMetadata';
import { createExpressRoute } from 'typescript-routes-to-openapi-server';

type ImportState =
  | 'uninitialized'
  | 'waiting-for-authentication'
  | 'exporting'
  | 'updating-metadata'
  | 'importing'
  | 'imported';

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
    }
  >();

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

    const importState = this.importState.get(userId);

    if (
      !importState ||
      importState?.state === 'uninitialized' ||
      importState?.deviceCode?.expiresAt <= new Date()
    ) {
      const traktTvImport = new TraktTvExport();

      const deviceCode = await traktTvImport.authenticate(async (userCode) => {
        if (userCode !== this.importState.get(userId)?.deviceCode?.userCode) {
          return;
        }

        this.importState.set(userId, {
          state: 'exporting',
          deviceCode: this.importState.get(userId)?.deviceCode,
        });

        const exportedData = await traktTvImport.export();

        this.importState.set(userId, {
          ...this.importState.get(userId),
          state: 'updating-metadata',
          exportSummary: {
            watchlist: {
              movies: exportedData.watchlist.filter(traktTvMovieFilter).length,
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
              episodes: exportedData.rating.filter(traktTvEpisodeFilter).length,
            },
          },
          progress: undefined,
        });

        const mediaItemsMap = await updateMetadataForTraktTvImport(
          exportedData,
          (progress) => {
            this.importState.set(userId, {
              ...this.importState.get(userId),
              state: 'updating-metadata',
              progress: progress,
            });
          }
        );

        this.importState.set(userId, {
          ...this.importState.get(userId),
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
        ]) {
          await listItemRepository.addItem({
            userId: userId,
            watchlist: true,
            mediaItemId: item.mediaItemId,
            seasonId: item.seasonId || undefined,
            episodeId: item.episodeId || undefined,
          });
        }

        const seenUniqueBy = (seen: Seen) => ({
          userId: seen.userId,
          mediaItemId: seen.mediaItemId,
          date: seen.date,
          type: seen.type,
          action: seen.action,
          process: seen.progress,
        });

        await seenRepository.createManyUnique(seenMovies, seenUniqueBy);
        await seenRepository.createManyUnique(seenEpisodes, seenUniqueBy);

        await userRatingRepository.createMany(ratedMovies);
        await userRatingRepository.createMany(ratedTvShows);
        await userRatingRepository.createMany(ratedSeasons);
        await userRatingRepository.createMany(ratedEpisodes);

        this.importState.set(userId, {
          ...this.importState.get(userId),
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
          },
        });
      });

      this.importState.set(userId, {
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
    };
  }>(async (req, res) => {
    const userId = Number(req.user);

    const importState = this.importState.get(userId);

    if (!importState) {
      res.send({ state: 'uninitialized' });
      return;
    }

    res.send({
      state: importState.state,
      progress: importState.progress,
      exportSummary: importState.exportSummary,
      importSummary: importState.importSummary,
    });
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
  const movies = await getMediaItemsByTmdbIds(
    _.uniq(
      [
        ...exportedData.watchlist,
        ...exportedData.history,
        ...exportedData.rating,
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
    episode: {
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
    season: {
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
