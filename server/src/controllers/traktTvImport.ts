import _ from 'lodash';
import {
    mediaItemBackdropPath,
    MediaItemBase,
    MediaItemBaseWithSeasons,
    MediaItemItemsResponse,
    mediaItemPosterPath,
    MediaType,
} from 'src/entity/mediaItem';
import { TraktTvImport } from 'src/import/trakttv';
import { metadataProviders } from 'src/metadata/metadataProviders';
import { mediaItemRepository } from 'src/repository/mediaItem';
import { seenRepository } from 'src/repository/seen';
import { userRatingRepository } from 'src/repository/userRating';
import { watchlistRepository } from 'src/repository/watchlist';
import { updateMediaItem } from 'src/updateMetadata';
import { createExpressRoute } from 'typescript-routes-to-openapi-server';

/**
 * @openapi_tags TraktTvImport
 */
export class TraktTvImportController {
    private readonly importState = new Map<
        number,
        {
            traktTvImport: TraktTvImport;
            exportedData?: Awaited<
                ReturnType<typeof TraktTvImport.prototype.export>
            >;
            importing?: boolean;
        }
    >();

    /**
     * @openapi_operationId deviceToken
     */
    traktTvGetUserCode = createExpressRoute<{
        method: 'get';
        path: '/api/import-trakttv/device-token';
        responseBody: {
            userCode: string;
            verificationUrl: string;
        };
    }>(async (req, res) => {
        const userId = Number(req.user);

        let traktTvImport = this.importState.get(userId)?.traktTvImport;

        if (!traktTvImport) {
            traktTvImport = new TraktTvImport();
            this.importState.set(userId, {
                traktTvImport: traktTvImport,
                exportedData: null,
            });
        }

        res.send(await traktTvImport.authenticate());
    });

    /**
     * @openapi_operationId isAuthenticated
     */

    traktTvAuthenticated = createExpressRoute<{
        method: 'get';
        path: '/api/import-trakttv/is-authenticated';
        responseBody: boolean;
    }>(async (req, res) => {
        const userId = Number(req.user);

        const importState = this.importState.get(userId);

        if (!importState) {
            res.send(false);
            return;
        }

        res.send(importState.traktTvImport.isAuthenticated());
    });

    /**
     * @openapi_operationId itemsToImport
     */
    traktTvItemsToImport = createExpressRoute<{
        method: 'get';
        path: '/api/import-trakttv/items-to-import';
        responseBody: {
            watchlist: MediaItemItemsResponse[];
            seen: MediaItemItemsResponse[];
        };
    }>(async (req, res) => {
        const userId = Number(req.user);

        const importState = this.importState.get(userId);

        if (!importState || !importState.traktTvImport?.isAuthenticated()) {
            res.sendStatus(400);
            return;
        }

        if (!importState.exportedData) {
            importState.exportedData = await importState.traktTvImport.export();
        }

        const data = await getMediaItemsFromTraktTvExportData(
            importState.exportedData
        );

        res.send({
            watchlist: [
                ...Object.values(data.watchlistMovies).map(addAssets),
                ...Object.values(data.watchlistTvShows).map(addAssets),
            ],
            seen: [
                ...Object.values(data.historyMovies).map(addAssets),
                ...Object.values(data.historyTvShows).map(addAssets),
            ],
        });
    });

    /**
     * @openapi_operationId import
     */
    traktTvImport = createExpressRoute<{
        method: 'get';
        path: '/api/import-trakttv';
    }>(async (req, res) => {
        const userId = Number(req.user);

        const importState = this.importState.get(userId);

        if (
            !importState ||
            !importState.exportedData ||
            importState.importing
        ) {
            res.sendStatus(400);
            return;
        }

        importState.importing = true;

        const data = await getMediaItemsFromTraktTvExportData(
            importState.exportedData
        );

        await watchlistRepository.createMany(
            importState.exportedData.watchlist
                .filter((item) => item.movie)
                .map((item) => ({
                    userId: userId,
                    mediaItemId: data.watchlistMovies[item.movie?.ids?.imdb].id,
                }))
        );

        await watchlistRepository.createMany(
            importState.exportedData.watchlist
                .filter((item) => item.show)
                .map((item) => ({
                    userId: userId,
                    mediaItemId: data.watchlistTvShows[item.show?.ids?.imdb].id,
                }))
        );

        await seenRepository.createMany(
            importState.exportedData.history
                .filter((item) => item.movie)
                .map((item) => ({
                    userId: userId,
                    mediaItemId: data.historyMovies[item.movie?.ids?.imdb].id,
                    date: new Date(item.watched_at).getTime(),
                }))
        );

        const tvShowsWithSeasons = new Map<string, MediaItemBaseWithSeasons>();

        for (const [imdbId, mediaItem] of [
            ...Object.entries(data.historyTvShows),
            ...Object.entries(data.ratingTvShows),
        ]) {
            if (mediaItem.needsDetails) {
                tvShowsWithSeasons.set(
                    imdbId,
                    await updateMediaItem(mediaItem)
                );
            }
        }

        await seenRepository.createMany(
            (
                await Promise.all(
                    importState.exportedData.history
                        .filter((item) => item.show)
                        .map(async (item) => {
                            const imdbId = item.show?.ids?.imdb;

                            const res = await getEpisodeOrSeason({
                                imdbId: imdbId,
                                items: data.historyTvShows,
                                seasonNumber: item.episode?.season,
                                episodeNumber: item.episode?.number,
                                tvShowsWithSeasons: tvShowsWithSeasons,
                            });

                            if (!res?.episode) {
                                return;
                            }

                            return {
                                userId: userId,
                                mediaItemId: res.mediaItemId,
                                episodeId: res.episode.id,
                                date: new Date(item.watched_at).getTime(),
                            };
                        })
                )
            ).filter(Boolean)
        );

        await userRatingRepository.createMany(
            importState.exportedData.rating
                .filter((item) => item.movie)
                .map((item) => ({
                    userId: userId,
                    mediaItemId: data.ratingMovies[item.movie?.ids?.imdb].id,
                    rating: item.rating / 2,
                    date: new Date(item.rated_at).getTime(),
                }))
        );

        await userRatingRepository.createMany(
            importState.exportedData.rating
                .filter((item) => item.show && !item.season && !item.episode)
                .map((item) => ({
                    userId: userId,
                    mediaItemId: data.ratingMovies[item.movie?.ids?.imdb].id,
                    rating: item.rating / 2,
                    date: new Date(item.rated_at).getTime(),
                }))
        );

        await userRatingRepository.createMany(
            (
                await Promise.all(
                    importState.exportedData.rating
                        .filter(
                            (item) => item.show && item.season && !item.episode
                        )
                        .map(async (item) => {
                            const res = await getEpisodeOrSeason({
                                imdbId: item.show?.ids?.imdb,
                                items: data.ratingTvShows,
                                seasonNumber: item.season.number,
                                tvShowsWithSeasons: tvShowsWithSeasons,
                            });

                            if (!res?.season) {
                                return;
                            }
                            return {
                                userId: userId,
                                mediaItemId: res.mediaItemId,
                                rating: item.rating / 2,
                                date: new Date(item.rated_at).getTime(),
                                seasonId: res.season.id,
                            };
                        })
                )
            ).filter(Boolean)
        );

        await userRatingRepository.createMany(
            (
                await Promise.all(
                    importState.exportedData.rating
                        .filter(
                            (item) => item.show && !item.season && item.episode
                        )
                        .map(async (item) => {
                            const res = await getEpisodeOrSeason({
                                imdbId: item.show?.ids?.imdb,
                                items: data.ratingTvShows,
                                seasonNumber: item.episode.season,
                                episodeNumber: item.episode.number,
                                tvShowsWithSeasons: tvShowsWithSeasons,
                            });

                            if (!res?.episode) {
                                return;
                            }
                            return {
                                userId: userId,
                                mediaItemId: res.mediaItemId,
                                rating: item.rating / 2,
                                date: new Date(item.rated_at).getTime(),
                                episodeId: res.episode.id,
                            };
                        })
                )
            ).filter(Boolean)
        );

        this.importState.delete(userId);

        res.sendStatus(200);
    });
}

const getEpisodeOrSeason = async (args: {
    imdbId: string;
    items: _.Dictionary<MediaItemBase>;
    seasonNumber: number;
    episodeNumber?: number;
    tvShowsWithSeasons: Map<string, MediaItemBaseWithSeasons>;
}) => {
    const {
        imdbId,
        items,
        seasonNumber,
        episodeNumber,
        tvShowsWithSeasons,
    } = args;

    if (!imdbId) {
        return;
    }

    const mediaItem = items[imdbId];

    if (!mediaItem) {
        return;
    }

    if (!tvShowsWithSeasons.has(imdbId)) {
        const seasons = await mediaItemRepository.seasonsWithEpisodes(
            mediaItem
        );

        tvShowsWithSeasons.set(imdbId, {
            ...mediaItem,
            seasons: seasons,
        });
    }

    const season = tvShowsWithSeasons
        .get(imdbId)
        ?.seasons?.find((season) => season.seasonNumber === seasonNumber);

    return {
        mediaItemId: mediaItem.id,
        season: season,
        episode: episodeNumber
            ? season?.episodes?.find(
                  (episode) => episode.episodeNumber === episodeNumber
              )
            : undefined,
    };
};

const addAssets = (item: MediaItemBase) => {
    return {
        ...item,
        poster: item.poster ? mediaItemPosterPath(item.id, 'small') : null,
        posterSmall: item.poster
            ? mediaItemPosterPath(item.id, 'original')
            : null,
        backdrop: item.backdrop ? mediaItemBackdropPath(item.id) : null,
    };
};

const getMediaItemsByImdbIds = async (
    imdbId: string[],
    mediaType: MediaType
) => {
    const foundMediaItems = await mediaItemRepository.findByExternalIds({
        imdbId: imdbId,
    });

    const foundMediaItemsMap = _.keyBy(
        foundMediaItems,
        (mediaItem) => mediaItem.imdbId
    );

    const missingItems = imdbId.filter((imdbId) => !foundMediaItemsMap[imdbId]);

    for (const missingItem of missingItems) {
        const metadataProvider = metadataProviders.get(mediaType);
        const item = await metadataProvider.findByImdbId(missingItem);
        const id = await mediaItemRepository.create(item);

        foundMediaItemsMap[missingItem] = {
            ...item,
            id: id,
            lastTimeUpdated: new Date().getTime(),
        };
    }

    return foundMediaItemsMap;
};

const getMediaItemsFromTraktTvExportData = async (
    exportedData: Awaited<ReturnType<typeof TraktTvImport.prototype.export>>
) => {
    const watchlistMovies = await getMediaItemsByImdbIds(
        exportedData.watchlist
            .filter((item) => item.movie)
            .map((item) => item.movie.ids.imdb),
        'movie'
    );
    const watchlistTvShows = await getMediaItemsByImdbIds(
        exportedData.watchlist
            .filter((item) => item.show)
            .map((item) => item.show.ids.imdb),
        'tv'
    );

    const historyMovies = await getMediaItemsByImdbIds(
        exportedData.history
            .filter((item) => item.movie)
            .map((item) => item.movie.ids.imdb),
        'movie'
    );
    const historyTvShows = await getMediaItemsByImdbIds(
        exportedData.history
            .filter((item) => item.show)
            .map((item) => item.show.ids.imdb),
        'tv'
    );

    const ratingMovies = await getMediaItemsByImdbIds(
        exportedData.rating
            .filter((item) => item.movie)
            .map((item) => item.movie.ids.imdb),
        'movie'
    );
    const ratingTvShows = await getMediaItemsByImdbIds(
        exportedData.rating
            .filter((item) => item.show)
            .map((item) => item.show.ids.imdb),
        'tv'
    );

    return {
        watchlistMovies,
        watchlistTvShows,
        historyMovies,
        historyTvShows,
        ratingMovies,
        ratingTvShows,
    };
};
