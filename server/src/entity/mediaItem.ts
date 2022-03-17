import { UserRating } from 'src/entity/userRating';
import { Seen } from 'src/entity/seen';
import { TvEpisode } from 'src/entity/tvepisode';
import { TvSeason } from 'src/entity/tvseason';
import { AudibleLang } from 'src/entity/configuration';
import { toSlug } from 'src/slug';

export type MediaType = 'tv' | 'movie' | 'book' | 'video_game' | 'audiobook';

export type ExternalIds = {
  tmdbId?: number;
  imdbId?: string;
  tvmazeId?: number;
  igdbId?: number;
  openlibraryId?: string;
  audibleId?: string;
  traktId?: number;
  goodreadsId?: number;
};

export type MediaItemBase = ExternalIds & {
  id?: number;
  numberOfSeasons?: number;
  status?: string;
  platform?: string[];
  title: string;
  slug?: string;
  originalTitle?: string;
  poster?: string;
  backdrop?: string;
  tmdbRating?: number;
  releaseDate?: string;
  overview?: string;
  lastTimeUpdated?: number;
  source: string;
  network?: string;
  url?: string;
  runtime?: number;
  mediaType: MediaType;
  genres?: string[];
  numberOfEpisodes?: number;
  developer?: string;
  authors?: string[];
  narrators?: string[];
  language?: string;
  numberOfPages?: number;
  audibleCountryCode?: AudibleLang;
  needsDetails?: boolean;
  lockedAt?: number;
};

export type MediaItemBaseWithSeasons = MediaItemBase & {
  seasons?: TvSeason[];
};

export type MediaItemForProvider = Omit<
  MediaItemBase,
  'id' | 'lastTimeUpdated'
> & {
  seasons?: TvSeasonForProvider[];
};

export type TvEpisodeForProvider = Omit<
  TvEpisode,
  'id' | 'tvShowId' | 'seasonId'
>;
export type TvSeasonForProvider = Omit<
  TvSeason,
  'id' | 'tvShowId' | 'episodes'
> & {
  episodes?: TvEpisodeForProvider[];
};

export type MediaItemDetailsResponse = Omit<
  MediaItemBaseWithSeasons,
  'lockedAt'
> & {
  isSearchResult?: boolean;
  hasDetails?: boolean;

  poster?: string;
  posterSmall?: string;
  backdrop?: string;

  seenHistory?: Seen[];
  unseenEpisodesCount?: number;
  userRating?: UserRating;
  upcomingEpisode?: TvEpisode;
  lastAiredEpisode?: TvEpisode;
  nextAiring?: string;
  lastAiring?: string;
  onWatchlist?: boolean;
  lastSeenAt?: number;
  seen?: boolean;
  firstUnwatchedEpisode?: TvEpisode;
  progress?: number;
};

export type MediaItemItemsResponse = Omit<MediaItemBase, 'lockedAt'> & {
  isSearchResult?: boolean;
  hasDetails?: boolean;

  poster?: string;
  posterSmall?: string;
  backdrop?: string;

  seenHistory?: Seen[];
  unseenEpisodesCount?: number;
  userRating?: UserRating;
  upcomingEpisode?: TvEpisode;
  lastAiredEpisode?: TvEpisode;
  nextAiring?: string;
  lastAiring?: string;
  onWatchlist?: boolean;
  lastSeenAt?: number;
  seen?: boolean;
  firstUnwatchedEpisode?: TvEpisode;
  progress?: number;
};

export const mediaItemColumns = <const>[
  'backdrop',
  'developer',
  'genres',
  'id',
  'igdbId',
  'imdbId',
  'audibleId',
  'lastTimeUpdated',
  'mediaType',
  'network',
  'numberOfSeasons',
  'openlibraryId',
  'originalTitle',
  'overview',
  'platform',
  'poster',
  'releaseDate',
  'tmdbRating',
  'runtime',
  'source',
  'status',
  'title',
  'tmdbId',
  'tvmazeId',
  'url',
  'needsDetails',
  'authors',
  'narrators',
  'language',
  'goodreadsId',
  'numberOfPages',
  'traktId',
  'audibleCountryCode',
  'slug',
];

export const mediaItemPosterPath = (
  mediaItemId: number,
  size: 'small' | 'original'
) => {
  return `img/poster?${new URLSearchParams({
    mediaItemId: mediaItemId.toString(),
    size: size,
  })}`;
};

export const mediaItemBackdropPath = (mediaItemId: number) => {
  return `img/backdrop?${new URLSearchParams({
    mediaItemId: mediaItemId.toString(),
  })}`;
};

export const seasonPosterPath = (
  seasonId: number,
  size: 'small' | 'original'
) => {
  return `img/poster?${new URLSearchParams({
    seasonId: seasonId.toString(),
    size: size,
  })}`;
};

export const mediaItemSlug = (mediaItem: MediaItemBase) => {
  if (mediaItem.releaseDate) {
    return toSlug(
      `${mediaItem.title}-${new Date(mediaItem.releaseDate).getFullYear()}`
    );
  } else {
    return toSlug(mediaItem.title);
  }
};
