import { UserRating } from 'src/entity/userRating';
import { Seen } from 'src/entity/seen';
import { MediaItemItemsResponse } from 'src/entity/mediaItem';

export type TvEpisode = {
    id?: number;
    title: string;
    description?: string;
    episodeNumber: number;
    seasonNumber: number;
    releaseDate?: string;
    tvShowId?: number;
    seasonId?: number;
    tmdbId?: number;
    imdbId?: string;
    runtime?: number;
    seenHistory?: Seen[];
    userRating?: UserRating;
    lastSeenAt?: number;
    seasonAndEpisodeNumber?: number;
    seen?: boolean;
    tvShow?: MediaItemItemsResponse;
    isSpecialEpisode: boolean;
};

export const tvEpisodeColumns = <const>[
    'releaseDate',
    'description',
    'episodeNumber',
    'id',
    'imdbId',
    'runtime',
    'seasonId',
    'seasonNumber',
    'title',
    'tmdbId',
    'tvShowId',
    'isSpecialEpisode',
    'seasonAndEpisodeNumber',
];

export class TvEpisodeFilters {
    public static unwatchedEpisodes = (episode: TvEpisode) => {
        return !episode.seenHistory || episode.seenHistory?.length === 0;
    };

    public static nonSpecialEpisodes = (episode: TvEpisode) => {
        return !episode.isSpecialEpisode;
    };

    public static releasedEpisodes = (episode: TvEpisode) => {
        return (
            episode.releaseDate &&
            episode.releaseDate.trim() != '' &&
            new Date(episode.releaseDate) <= new Date()
        );
    };

    public static unreleasedEpisodes = (episode: TvEpisode) => {
        return (
            !episode.releaseDate ||
            episode.releaseDate.trim() == '' ||
            new Date(episode.releaseDate) > new Date()
        );
    };

    public static withReleaseDateEpisodes = (episode: TvEpisode) => {
        return episode.releaseDate !== undefined;
    };
}
