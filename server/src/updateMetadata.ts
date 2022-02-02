import _ from 'lodash';
import chalk from 'chalk';
import { plural, t } from '@lingui/macro';

import {
    MediaItemBase,
    MediaItemBaseWithSeasons,
    MediaItemForProvider,
} from 'src/entity/mediaItem';
import { TvEpisode } from 'src/entity/tvepisode';
import { TvSeason, TvSeasonFilters } from 'src/entity/tvseason';
import { metadataProviders } from 'src/metadata/metadataProviders';
import { mediaItemRepository } from 'src/repository/mediaItem';
import { downloadAsset, durationToMilliseconds } from 'src/utils';
import { tvEpisodeRepository } from 'src/repository/episode';
import { tvSeasonRepository } from 'src/repository/season';
import { Notifications } from 'src/notifications/notifications';
import { userRepository } from 'src/repository/user';
import { User } from 'src/entity/user';

const getItemsToDelete = (
    oldMediaItem: MediaItemBaseWithSeasons,
    updatedMediaItem: MediaItemBaseWithSeasons
): [Array<TvEpisode>, Array<TvSeason>] => {
    const oldSeasonsMap = _.keyBy(
        oldMediaItem.seasons,
        (season) => season.seasonNumber
    );

    const newSeasonsMap = _.keyBy(
        updatedMediaItem.seasons,
        (season) => season.seasonNumber
    );

    const oldSeasons = oldMediaItem.seasons?.map(
        (season) => season.seasonNumber
    );
    const newSeasons = updatedMediaItem.seasons?.map(
        (season) => season.seasonNumber
    );

    const seasonNumbersToDelete = _.difference(oldSeasons, newSeasons);
    const seasonToDelete = seasonNumbersToDelete.map(
        (seasonNumber) => oldSeasonsMap[seasonNumber]
    );

    const episodesToDelete = oldMediaItem.seasons?.flatMap((season) => {
        const episodesMap = _.keyBy(
            oldSeasonsMap[season.seasonNumber]?.episodes,
            (episode) => episode.episodeNumber
        );

        const oldEpisodes = season?.episodes?.map(
            (episode) => episode.episodeNumber
        );
        const newEpisodes = newSeasonsMap[season.seasonNumber]?.episodes?.map(
            (episode) => episode.episodeNumber
        );

        const episodesNumbersToDelete = _.difference(oldEpisodes, newEpisodes);

        return episodesNumbersToDelete.map(
            (episodeNumber) => episodesMap[episodeNumber]
        );
    });

    return [episodesToDelete, seasonToDelete];
};

const merge = (
    oldMediaItem: MediaItemBaseWithSeasons,
    newMediaItem: MediaItemForProvider
): MediaItemBaseWithSeasons => {
    const seasonsMap = _.keyBy(
        oldMediaItem.seasons,
        (season) => season.seasonNumber
    );

    const mediaItemId = oldMediaItem.id;

    return {
        ...newMediaItem,
        lastTimeUpdated: new Date().getTime(),
        id: mediaItemId,
        seasons: newMediaItem.seasons?.map((season) => {
            const seasonId = seasonsMap[season.seasonNumber]?.id;

            const episodesMap = _.keyBy(
                seasonsMap[season.seasonNumber]?.episodes,
                (episode) => episode.episodeNumber
            );

            return {
                ...season,
                id: seasonId,
                tvShowId: mediaItemId,
                episodes: season.episodes?.map((episode) => ({
                    ...episode,
                    id: episodesMap[episode.episodeNumber]?.id,
                    tvShowId: mediaItemId,
                    seasonId: seasonId,
                })),
            };
        }),
    };
};

const downloadNewAssets = async (
    oldMediaItem: MediaItemBaseWithSeasons,
    newMediaItem: MediaItemBaseWithSeasons
) => {
    if (oldMediaItem.poster && newMediaItem.poster !== oldMediaItem.poster) {
        await downloadAsset({
            assetsType: 'poster',
            mediaItem: newMediaItem,
        });
    }

    if (
        oldMediaItem.backdrop &&
        newMediaItem.backdrop !== oldMediaItem.backdrop
    ) {
        await downloadAsset({
            assetsType: 'backdrop',
            mediaItem: newMediaItem,
        });
    }

    const oldSeasonsMap = _.keyBy(
        oldMediaItem.seasons,
        (season) => season.seasonNumber
    );

    await Promise.all(
        newMediaItem.seasons
            ?.filter((season) => season.poster)
            ?.filter(
                (season) => season.poster !== oldSeasonsMap[season.id]?.poster
            )
            .map((season) =>
                downloadAsset({
                    assetsType: 'poster',
                    season: season,
                })
            ) || []
    );
};

const sendNotifications = async (
    oldMediaItem: MediaItemBaseWithSeasons,
    newMediaItem: MediaItemBaseWithSeasons
) => {
    const users = await userRepository.usersWithMediaItemOnWatchlist(
        oldMediaItem.id
    );

    const send = async (args: {
        message: string;
        filter: (user: User) => boolean;
    }) => {
        await Promise.all(
            users.map((user) =>
                Notifications.send({
                    userId: user.id,
                    message: args.message,
                })
            )
        );
    };

    if (
        newMediaItem.status !== oldMediaItem.status &&
        !(!newMediaItem.status && !oldMediaItem.status)
    ) {
        await send({
            message: t`Status changed for ${newMediaItem.title}: "${newMediaItem.status}"`,
            filter: (user) => user.sendNotificationWhenStatusChanges,
        });
    }

    if (
        newMediaItem.releaseDate !== oldMediaItem.releaseDate &&
        new Date(newMediaItem.releaseDate) > new Date()
    ) {
        await send({
            message: t`Release date changed for ${newMediaItem.title}: "${newMediaItem.releaseDate}"`,
            filter: (user) => user.sendNotificationWhenReleaseDateChanges,
        });
    }

    if (newMediaItem.mediaType === 'tv') {
        const oldMediaItemNonSpecialSeasons = oldMediaItem.seasons
            .filter(TvSeasonFilters.nonSpecialSeason)
            .sort(TvSeasonFilters.seasonNumber);
        const newMediaItemNonSpecialSeasons = newMediaItem.seasons
            .filter(TvSeasonFilters.nonSpecialSeason)
            .sort(TvSeasonFilters.seasonNumber);

        if (
            newMediaItemNonSpecialSeasons.length <
            oldMediaItemNonSpecialSeasons.length
        ) {
            const removedSeason =
                oldMediaItemNonSpecialSeasons[
                    oldMediaItemNonSpecialSeasons.length +
                        newMediaItemNonSpecialSeasons.length -
                        oldMediaItemNonSpecialSeasons.length -
                        1
                ];

            await send({
                message: t`Season ${removedSeason.seasonNumber} of ${newMediaItem.title} has been canceled`,
                filter: (user) =>
                    user.sendNotificationWhenNumberOfSeasonsChanges,
            });
        } else if (
            newMediaItemNonSpecialSeasons.length >
            oldMediaItemNonSpecialSeasons.length
        ) {
            const newSeason =
                newMediaItemNonSpecialSeasons[
                    oldMediaItemNonSpecialSeasons.length +
                        newMediaItemNonSpecialSeasons.length -
                        oldMediaItemNonSpecialSeasons.length -
                        1
                ];

            if (newSeason.releaseDate) {
                if (new Date(newSeason.releaseDate) > new Date())
                    await send({
                        message: t`New season of ${
                            newMediaItem.title
                        } will be released at ${new Date(
                            newSeason.releaseDate
                        ).toLocaleDateString()}`,
                        filter: (user) =>
                            user.sendNotificationWhenNumberOfSeasonsChanges,
                    });
            } else {
                await send({
                    message: t`${newMediaItem.title} got a new season`,
                    filter: (user) =>
                        user.sendNotificationWhenNumberOfSeasonsChanges,
                });
            }
        } else if (oldMediaItemNonSpecialSeasons.length > 0) {
            const oldMediaItemLastSeason =
                oldMediaItemNonSpecialSeasons[
                    oldMediaItemNonSpecialSeasons.length - 1
                ];
            const newMediaItemLastSeason =
                newMediaItemNonSpecialSeasons[
                    newMediaItemNonSpecialSeasons.length - 1
                ];

            if (
                oldMediaItemLastSeason.releaseDate !==
                    newMediaItemLastSeason.releaseDate &&
                new Date(newMediaItemLastSeason.releaseDate) > new Date()
            ) {
                await send({
                    message: t`Season ${
                        newMediaItemLastSeason.seasonNumber
                    } of ${newMediaItem.title} will be released at ${new Date(
                        newMediaItemLastSeason.releaseDate
                    ).toLocaleDateString()}`,
                    filter: (user) =>
                        user.sendNotificationWhenNumberOfSeasonsChanges,
                });
            }
        }
    }
};

export const updateMediaItem = async (
    oldMediaItem?: MediaItemBaseWithSeasons
) => {
    if (!oldMediaItem) {
        return;
    }

    await mediaItemRepository.lock(oldMediaItem.id);

    try {
        const metadataProvider = metadataProviders.get(
            oldMediaItem.mediaType,
            oldMediaItem.source
        );

        if (!metadataProvider) {
            throw new Error(
                `No metadata provider "${oldMediaItem.source}" for media type ${oldMediaItem.mediaType}`
            );
        }

        const newMediaItem = await metadataProvider.details(oldMediaItem);

        if (!newMediaItem) {
            throw new Error('No metadata');
        }

        if (newMediaItem.mediaType === 'tv') {
            oldMediaItem.seasons = await mediaItemRepository.seasonsWithEpisodes(
                oldMediaItem
            );
        }

        const updatedMediaItem = merge(oldMediaItem, newMediaItem);

        if (newMediaItem.mediaType === 'tv') {
            const [episodesToDelete, seasonToDelete] = getItemsToDelete(
                oldMediaItem,
                updatedMediaItem
            );

            if (episodesToDelete.length > 0 || seasonToDelete.length > 0) {
                const episodesIdToDelete = [
                    ...episodesToDelete.map((episode) => episode.id),
                    ...seasonToDelete.flatMap((season) =>
                        season.episodes.map((episode) => episode.id)
                    ),
                ];

                const seasonsIdsToDelete = seasonToDelete.map(
                    (season) => season.id
                );

                await tvEpisodeRepository.deleteManyById(episodesIdToDelete);
                await tvSeasonRepository.deleteManyById(seasonsIdsToDelete);
            }
        }

        await mediaItemRepository.update(updatedMediaItem);

        await downloadNewAssets(oldMediaItem, updatedMediaItem);

        if (!oldMediaItem.needsDetails) {
            await sendNotifications(oldMediaItem, updatedMediaItem);
        }

        await mediaItemRepository.unlock(oldMediaItem.id);
        return updatedMediaItem;
    } catch (error) {
        await mediaItemRepository.unlock(oldMediaItem.id);
        throw error;
    }
};

const shouldUpdate = (mediaItem: MediaItemBase) => {
    const timePassed = new Date().getTime() - mediaItem.lastTimeUpdated;

    if (
        mediaItem.mediaType !== 'tv' &&
        mediaItem.releaseDate &&
        new Date(mediaItem.releaseDate) < new Date() &&
        new Date(mediaItem.releaseDate) < new Date(mediaItem.lastTimeUpdated)
    ) {
        return (
            timePassed >=
            durationToMilliseconds({
                days: 30,
            })
        );
    }

    return timePassed >= durationToMilliseconds({ hours: 24 });
};

export const updateMetadata = async (): Promise<void> => {
    console.log(chalk.bold.green(t`Updating metadata`));

    let numberOfUpdatedItems = 0;
    let numberOfFailures = 0;
    const mediaItems = await mediaItemRepository.itemsToPossiblyUpdate();

    for (const mediaItem of mediaItems) {
        const skip = !shouldUpdate(mediaItem);

        if (skip) {
            continue;
        }

        const title = mediaItem.title;
        const date = chalk.blue(
            new Date(mediaItem.lastTimeUpdated).toLocaleString()
        );

        console.log(t`Updating: ${title} (last updated at: ${date}`);

        try {
            await updateMediaItem(mediaItem);
            numberOfUpdatedItems++;
        } catch (error) {
            console.log(chalk.red(error.toString()));
            numberOfFailures++;
        }
    }

    if (numberOfUpdatedItems === 0 && numberOfFailures === 0) {
        console.log(chalk.bold.green(t`Everything up to date`));
    } else {
        const count = numberOfUpdatedItems;

        console.log(
            chalk.bold.green(
                plural(count, {
                    one: 'Updated 1 item',
                    other: 'Updated # items',
                })
            )
        );

        if (numberOfFailures > 0) {
            const count = numberOfUpdatedItems;

            console.log(
                chalk.bold.red(
                    plural(count, {
                        one: 'Failed to update 1 item',
                        other: 'Failed to update # items',
                    })
                )
            );
        }
    }
};
