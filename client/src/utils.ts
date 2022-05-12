import { t } from '@lingui/macro';
import { parseISO } from 'date-fns';
import {
  MediaItemDetailsResponse,
  MediaItemItemsResponse,
  MediaType,
  TvEpisode,
  TvSeason,
  UserResponse,
} from 'mediatracker-api';

export const formatEpisodeNumber = (tvEpisode: TvEpisode): string => {
  return t`S${tvEpisode.seasonNumber
    .toString()
    .padStart(2, '0')}E${tvEpisode.episodeNumber.toString().padStart(2, '0')}`;
};

export const formatSeasonNumber = (season: TvSeason): string => {
  return t`S${season.seasonNumber.toString().padStart(2, '0')}`;
};

export const findEpisodeBeId = (
  mediaItem: MediaItemDetailsResponse,
  episodeId: number
) => {
  if (!mediaItem.seasons) {
    return null;
  }

  for (const season of mediaItem.seasons) {
    if (!season.episodes) {
      continue;
    }

    const ep = season.episodes.find((episode) => episode.id === episodeId);

    if (ep) {
      return ep;
    }
  }
};

export const getPosterHeight = (args: {
  mediaType?: MediaType;
  posterWidth: number;
}) => {
  const { mediaType, posterWidth } = args;

  switch (mediaType) {
    case 'video_game':
      return posterWidth / 0.75;

    case 'audiobook':
      return posterWidth;

    case 'book':
    case 'tv':
    case 'movie':
    default:
      return posterWidth * 1.5;
  }
};

export const hasBeenReleased = (
  value: MediaItemItemsResponse | TvEpisode | TvSeason
) => {
  const releaseDate = value.releaseDate;
  return releaseDate && parseISO(releaseDate) <= new Date();
};

export const hasReleaseDate = (
  value: MediaItemItemsResponse | TvEpisode | TvSeason
) => {
  return Boolean(value.releaseDate);
};

export const isOnWatchlist = (mediaItem: MediaItemItemsResponse) => {
  return mediaItem.onWatchlist === true;
};

export const isSeason = (
  value: MediaItemItemsResponse | TvEpisode | TvSeason
): value is TvSeason => {
  return !('episodeNumber' in value) && 'seasonNumber' in value;
};

export const isAudiobook = (mediaItem?: MediaItemItemsResponse | MediaType) => {
  return typeof mediaItem === 'string'
    ? mediaItem === 'audiobook'
    : mediaItem?.mediaType === 'audiobook';
};

export const isBook = (mediaItem?: MediaItemItemsResponse | MediaType) => {
  return typeof mediaItem === 'string'
    ? mediaItem === 'book'
    : mediaItem?.mediaType === 'book';
};

export const isMovie = (mediaItem?: MediaItemItemsResponse | MediaType) => {
  return typeof mediaItem === 'string'
    ? mediaItem === 'movie'
    : mediaItem?.mediaType === 'movie';
};

export const isTvShow = (mediaItem?: MediaItemItemsResponse | MediaType) => {
  return typeof mediaItem === 'string'
    ? mediaItem === 'tv'
    : mediaItem?.mediaType === 'tv';
};

export const isVideoGame = (mediaItem?: MediaItemItemsResponse | MediaType) => {
  return typeof mediaItem === 'string'
    ? mediaItem === 'video_game'
    : mediaItem?.mediaType === 'video_game';
};

export const hasPoster = (mediaItem: MediaItemItemsResponse) => {
  return mediaItem.posterSmall != undefined;
};

export const hideEpisodeTitle = (user: UserResponse) => {
  return user.hideEpisodeTitleForUnseenEpisodes;
};

export const hideSeasonOverview = (user: UserResponse) => {
  return user.hideOverviewForUnseenSeasons;
};

export const hasProgress = (mediaItem: MediaItemItemsResponse) => {
  return mediaItem.progress !== null && mediaItem.progress !== undefined;
};

export const reverseMap = <Keys extends string, Values extends string>(
  map: Record<Keys, Values>
): Record<Values, Keys> => {
  return Object.fromEntries(
    Object.entries(map).map(([key, value]) => [value, key])
  );
};

export const canMetadataBeUpdated = (mediaItem: MediaItemItemsResponse) => {
  return ['igdb', 'tmdb', 'openlibrary', 'audible'].includes(
    mediaItem.source?.toLowerCase()
  );
};

export const listDescription = (list?: {
  description?: string;
  isWatchlist: boolean;
}) => {
  return list?.isWatchlist
    ? t`Movies, shows, seasons, episodes, books, audiobooks and video games I plan to watch/read/listen/play`
    : list?.description;
};

export const listName = (list?: { name: string; isWatchlist: boolean }) => {
  return list?.isWatchlist ? t`Watchlist` : list?.name;
};
