import _ from 'lodash';

import { createExpressRoute } from 'typescript-routes-to-openapi-server';
import { TvEpisodeFilters } from 'src/entity/tvepisode';
import { tvEpisodeRepository } from 'src/repository/episode';
import { LastSeenAt, mediaItemRepository } from 'src/repository/mediaItem';
import { tvSeasonRepository } from 'src/repository/season';
import { seenRepository } from 'src/repository/seen';
import { watchlistRepository } from 'src/repository/watchlist';

/**
 * @openapi_tags Seen
 */
export class SeenController {
    /**
     * @openapi_operationId add
     */
    add = createExpressRoute<{
        method: 'put';
        path: '/api/seen';
        requestQuery: {
            mediaItemId: number;
            seasonId?: number;
            episodeId?: number;
            lastSeenEpisodeId?: number;
            lastSeenAt?: LastSeenAt;
            date?: number;
        };
    }>(async (req, res) => {
        const userId = Number(req.user);

        const {
            mediaItemId,
            seasonId,
            episodeId,
            lastSeenAt,
            lastSeenEpisodeId,
        } = req.query;

        let date = req.query.date ? new Date(req.query.date) : null;

        if (!date) {
            if (lastSeenAt === 'now') {
                date = new Date();
            } else if (lastSeenAt === 'unknown') {
                date = new Date(0);
            } else if (lastSeenAt === 'release_date') {
                if (episodeId) {
                    const episode = await tvEpisodeRepository.findOne({
                        id: episodeId,
                    });

                    date = new Date(episode.releaseDate);
                } else if (seasonId) {
                    const season = await tvSeasonRepository.findOne({
                        id: seasonId,
                    });
                    date = new Date(season.releaseDate);
                } else {
                    const mediaItem = await mediaItemRepository.findOne({
                        id: mediaItemId,
                    });
                    if (!mediaItem) {
                        res.sendStatus(400);
                        return;
                    }
                    date = new Date(mediaItem.releaseDate);
                }
            }
        }

        if (lastSeenEpisodeId) {
            const episodes = await tvEpisodeRepository.find({
                tvShowId: mediaItemId,
                seasonId: seasonId || undefined,
            });

            const lastEpisode = episodes.find(
                (episode) => episode.id === lastSeenEpisodeId
            );

            if (!lastEpisode) {
                throw new Error(`No episode with id ${lastSeenEpisodeId}`);
            }

            const seenEpisodes = episodes
                .filter(TvEpisodeFilters.unwatchedEpisodes)
                .filter(TvEpisodeFilters.releasedEpisodes)
                .filter(TvEpisodeFilters.nonSpecialEpisodes)
                .filter(
                    (episode) =>
                        episode.seasonNumber < lastEpisode.seasonNumber ||
                        (episode.seasonNumber === lastEpisode.seasonNumber &&
                            episode.episodeNumber <= lastEpisode.episodeNumber)
                );

            await seenRepository.createMany(
                seenEpisodes.map((episode) => ({
                    userId: userId,
                    mediaItemId: mediaItemId,
                    seasonId: episode.seasonId,
                    episodeId: episode.id,
                    date:
                        lastSeenAt === 'release_date'
                            ? new Date(episode.releaseDate).getTime()
                            : date?.getTime() || 0,
                }))
            );
        } else {
            const mediaItem = await mediaItemRepository.findOne({
                id: mediaItemId,
            });

            if (!mediaItem) {
                res.sendStatus(400);
                return;
            }

            if (episodeId) {
                const episode = await tvEpisodeRepository.findOne({
                    id: episodeId,
                });

                await seenRepository.create({
                    userId: userId,
                    mediaItemId: mediaItemId,
                    seasonId: episode.seasonId,
                    episodeId: episodeId,
                    date: date?.getTime() || 0,
                });
            } else if (seasonId) {
                const episodes = await tvEpisodeRepository.find({
                    seasonId: seasonId,
                });

                await seenRepository.createMany(
                    episodes
                        .filter(TvEpisodeFilters.unwatchedEpisodes)
                        .filter(TvEpisodeFilters.nonSpecialEpisodes)
                        .filter(TvEpisodeFilters.releasedEpisodes)
                        .map((episode) => ({
                            userId: userId,
                            mediaItemId: mediaItemId,
                            seasonId: episode.seasonId,
                            episodeId: episode.id,
                            date:
                                lastSeenAt === 'release_date'
                                    ? new Date(episode.releaseDate).getTime()
                                    : date?.getTime() || 0,
                        }))
                );
            } else {
                if (mediaItem.mediaType === 'tv') {
                    const episodes = await tvEpisodeRepository.find({
                        tvShowId: mediaItemId,
                    });

                    await seenRepository.createMany(
                        episodes
                            .filter(TvEpisodeFilters.nonSpecialEpisodes)
                            .filter(TvEpisodeFilters.releasedEpisodes)
                            .map((episode) => ({
                                userId: userId,
                                mediaItemId: mediaItemId,
                                seasonId: episode.seasonId,
                                episodeId: episode.id,
                                date:
                                    lastSeenAt === 'release_date'
                                        ? new Date(
                                              episode.releaseDate
                                          ).getTime()
                                        : date?.getTime() || 0,
                            }))
                    );
                } else {
                    await seenRepository.create({
                        userId: userId,
                        mediaItemId: mediaItemId,
                        episodeId: null,
                        date: date?.getTime() || 0,
                    });
                }
            }

            if (mediaItem.mediaType !== 'tv') {
                await watchlistRepository.delete({
                    userId: userId,
                    mediaItemId: mediaItemId,
                });
            }
        }

        res.send();
    });

    /**
     * @openapi_operationId deleteById
     */
    deleteById = createExpressRoute<{
        method: 'delete';
        path: '/api/seen/:seenId';
        pathParams: {
            seenId: number;
        };
    }>(async (req, res) => {
        const { seenId } = req.params;

        await seenRepository.delete({
            id: seenId,
        });

        res.send();
    });

    /**
     * @openapi_operationId delete
     */
    removeFromSeenHistory = createExpressRoute<{
        method: 'delete';
        path: '/api/seen/';
        requestQuery: {
            mediaItemId: number;
            seasonId?: number;
            episodeId?: number;
        };
    }>(async (req, res) => {
        const userId = Number(req.user);

        const { mediaItemId, seasonId, episodeId } = req.query;

        if (episodeId) {
            await seenRepository.delete({
                userId: userId,
                episodeId: episodeId,
            });
        } else if (seasonId) {
            await seenRepository.delete({
                userId: userId,
                seasonId: seasonId,
            });
        } else {
            await seenRepository.delete({
                userId: userId,
                mediaItemId: mediaItemId,
            });
        }

        res.send();
    });
}
