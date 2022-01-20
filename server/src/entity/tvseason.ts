import { UserRating } from 'src/entity/userRating';
import { TvEpisode } from 'src/entity/tvepisode';

export type TvSeason = {
    id?: number;
    description?: string;
    numberOfEpisodes?: number;
    poster?: string;
    releaseDate?: string;
    tvShowId?: number;
    tmdbId?: number;
    title: string;
    seasonNumber: number;
    tvmazeId?: number;
    episodes?: TvEpisode[];
    userRating?: UserRating;
    seen?: boolean;
    posterSmall?: string;
    isSpecialSeason: boolean;
};

export const tvSeasonColumns = <const>[
    'description',
    'id',
    'isSpecialSeason',
    'numberOfEpisodes',
    'poster',
    'releaseDate',
    'seasonNumber',
    'title',
    'tmdbId',
    'tvShowId',
];

export class TvSeasonFilters {
    public static nonSpecialSeason = (season: TvSeason) => {
        return !season.isSpecialSeason;
    };

    public static seasonNumber = (season: TvSeason) => {
        return season.seasonNumber;
    };
}
