import {
  MediaItemDetailsResponse,
  MediaItemItemsResponse,
  MediaType,
  TvEpisode,
  TvSeason,
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
  return hasBeenReleased(mediaItem) && !mediaItem.lastSeenAt;
};

export const canBeOnWatchlist = (mediaItem: MediaItemItemsResponse) => {
  return !mediaItem.seen || isTvShow(mediaItem);
};

export const canBeRated = (mediaItem: MediaItemItemsResponse | TvEpisode) => {
  return hasBeenReleased(mediaItem);
};

export const isTvShow = (mediaItem: MediaItemItemsResponse) => {
  return mediaItem.mediaType === 'tv';
};

export const hasPoster = (mediaItem: MediaItemItemsResponse) => {
  return mediaItem.posterSmall != undefined;
};
