import {
  MediaItemDetailsResponse,
  MediaItemItemsResponse,
  MediaType,
  TvEpisode,
  TvSeason,
  UserResponse,
} from 'mediatracker-api';
import { hasBeenReleased } from 'src/mediaItem';

export const formatEpisodeNumber = (tvEpisode: TvEpisode): string => {
  return `S${tvEpisode.seasonNumber
    .toString()
    .padStart(2, '0')}E${tvEpisode.episodeNumber.toString().padStart(2, '0')}`;
};

export const formatSeasonNumber = (season: TvSeason): string => {
  return `S${season.seasonNumber.toString().padStart(2, '0')}`;
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

export const canBeMarkedAsSeen = (mediaItem: MediaItemItemsResponse) => {
  return hasBeenReleased(mediaItem) && typeof mediaItem.lastSeenAt !== 'number';
};

export const canBeOnWatchlist = (mediaItem: MediaItemItemsResponse) => {
  return !mediaItem.seen || isTvShow(mediaItem);
};

export const canBeRated = (mediaItem: MediaItemItemsResponse | TvEpisode) => {
  return hasBeenReleased(mediaItem);
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

export const reverseMap = <Keys extends string, Values extends string>(
  map: Record<Keys, Values>
): Record<Values, Keys> => {
  return Object.fromEntries(
    Object.entries(map).map(([key, value]) => [value, key])
  );
};
