import { parseISO } from 'date-fns';

import { t } from '@lingui/macro';

import type {
  EpisodeResponse,
  MediaItemResponse,
  SeasonResponse,
} from '@server/entity/mediaItemModel';
import type { ProgressModel } from '@server/entity/progressModel';
export const hasReleaseDate = <
  T extends {
    releaseDate?: string | null;
  },
>(
  value: T
): value is T & { releaseDate: string } => {
  return typeof value.releaseDate === 'string';
};

export const hasBeenReleased = (value: {
  releaseDate?: string | null;
}): boolean => {
  return (
    typeof value.releaseDate === 'string' &&
    parseISO(value.releaseDate) <= new Date()
  );
};

export const hasDetails = (mediaItem: MediaItemResponse): boolean => {
  return (
    typeof mediaItem.unseenEpisodesCount === 'number' &&
    typeof mediaItem.seenEpisodesCount === 'number'
  );
};

export const isOnWatchlist = (mediaItem: MediaItemResponse): boolean => {
  return mediaItem.onWatchlist === true;
};

export const isSeason = (
  value: MediaItemResponse | EpisodeResponse | SeasonResponse
): value is SeasonResponse => {
  return !('episodeNumber' in value) && 'seasonNumber' in value;
};

export const isAudiobook = (mediaItem?: MediaItemResponse): boolean => {
  return typeof mediaItem === 'string'
    ? mediaItem === 'audiobook'
    : mediaItem?.mediaType === 'audiobook';
};

export const isBook = (mediaItem?: MediaItemResponse): boolean => {
  return typeof mediaItem === 'string'
    ? mediaItem === 'book'
    : mediaItem?.mediaType === 'book';
};

export const isMovie = (mediaItem?: MediaItemResponse): boolean => {
  return typeof mediaItem === 'string'
    ? mediaItem === 'movie'
    : mediaItem?.mediaType === 'movie';
};

export const isTvShow = (mediaItem?: MediaItemResponse): boolean => {
  return typeof mediaItem === 'string'
    ? mediaItem === 'tv'
    : mediaItem?.mediaType === 'tv';
};

export const isVideoGame = (mediaItem?: MediaItemResponse): boolean => {
  return typeof mediaItem === 'string'
    ? mediaItem === 'video_game'
    : mediaItem?.mediaType === 'video_game';
};

export const hasUnseenEpisodes = (
  mediaItem: MediaItemResponse
): mediaItem is MediaItemResponse & { unseenEpisodesCount: number } => {
  return (
    typeof mediaItem.unseenEpisodesCount === 'number' &&
    mediaItem.unseenEpisodesCount > 0
  );
};

export const hasProgress = (
  mediaItem: MediaItemResponse
): mediaItem is MediaItemResponse & { progress: ProgressModel } => {
  return mediaItem.progress !== null && mediaItem.progress !== undefined;
};

export const hasFirstUnwatchedEpisode = (
  mediaItem: MediaItemResponse
): mediaItem is MediaItemResponse & {
  firstUnwatchedEpisode: EpisodeResponse;
} => {
  return (
    mediaItem.firstUnwatchedEpisode !== null &&
    mediaItem.firstUnwatchedEpisode !== undefined
  );
};

export const seenAllEpisodes = (mediaItem: MediaItemResponse): boolean => {
  return (
    mediaItem.mediaType === 'tv' &&
    mediaItem.unseenEpisodesCount === 0 &&
    typeof mediaItem.airedEpisodesCount === 'number' &&
    mediaItem.airedEpisodesCount > 0
  );
};

export const hasUpcomingEpisode = (
  mediaItem: MediaItemResponse
): mediaItem is MediaItemResponse & {
  upcomingEpisode: EpisodeResponse & { releaseDate: string };
} => {
  return (
    Boolean(mediaItem.upcomingEpisode) &&
    typeof mediaItem.upcomingEpisode?.releaseDate === 'string'
  );
};

export const hasLastAiredEpisode = (
  mediaItem: MediaItemResponse
): mediaItem is MediaItemResponse & {
  lastAiredEpisode: EpisodeResponse & { releaseDate: string };
} => {
  return (
    Boolean(mediaItem.lastAiredEpisode) &&
    typeof mediaItem.lastAiredEpisode?.releaseDate === 'string'
  );
};

export const hasBeenSeen = (mediaItem: MediaItemResponse): boolean => {
  return typeof mediaItem.lastSeenAt === 'number';
};

export const hasUserRating = (mediaItem: MediaItemResponse): boolean => {
  return typeof mediaItem.userRating?.rating === 'number';
};

export const formatEpisodeNumber = (episode: EpisodeResponse): string => {
  return t`S${episode.seasonNumber
    .toString()
    .padStart(2, '0')}E${episode.episodeNumber.toString().padStart(2, '0')}`;
};

export const formatSeasonNumber = (season: SeasonResponse): string => {
  return t`S${season.seasonNumber.toString().padStart(2, '0')}`;
};

export const releaseYear = (
  mediaItem: MediaItemResponse
): number | undefined => {
  if (!mediaItem.releaseDate) {
    return;
  }

  return parseISO(mediaItem.releaseDate).getFullYear();
};

export const posterAspectRatio = (mediaItem: MediaItemResponse) => {
  if (mediaItem.mediaType === 'audiobook') {
    return 'aspect-[1/1]';
  }

  if (mediaItem.mediaType === 'video_game') {
    return 'aspect-[3/4]';
  }

  return 'aspect-[2/3]';
};
export const posterSrc = (mediaItem: MediaItemResponse, width?: number) => {
  if (typeof mediaItem.poster !== 'string') {
    return null;
  }

  const url = new URL(mediaItem.poster, location.origin);

  if (typeof width === 'number') {
    url.searchParams.append('width', width.toString());
  }

  return url.href;
};
