import { useState, useEffect } from 'react';

import {
  MediaItemDetailsResponse,
  MediaItemItemsResponse,
  TvEpisode,
} from 'mediatracker-api';

export const firstUnwatchedSeasonId = (mediaItem: MediaItemDetailsResponse) => {
  if (mediaItem.seasons?.length === 0) {
    return;
  }

  // If seen, return last season
  if (mediaItem.seen) {
    return mediaItem.seasons[mediaItem.seasons.length - 1].id;
  }

  // If has unwatched episode, return season with first unwatched episode
  if (mediaItem.firstUnwatchedEpisode) {
    return mediaItem.firstUnwatchedEpisode.seasonId;
  }

  // Return first season, skip specials
  if (mediaItem.seasons.length > 1) {
    if (mediaItem.seasons[0].isSpecialSeason) {
      return mediaItem.seasons[1].id;
    }

    return mediaItem.seasons[0].id;
  } else {
    return mediaItem.seasons[0].id;
  }
};

export const hasBeenReleased = (
  mediaItem: TvEpisode | MediaItemDetailsResponse | MediaItemItemsResponse
) => {
  const releaseDate = mediaItem.releaseDate;
  return releaseDate && new Date(releaseDate) <= new Date();
};

export const useSelectedSeason = (mediaItem?: MediaItemDetailsResponse) => {
  const [selectedSeasonId, setSelectedSeasonId] = useState(null);

  useEffect(() => {
    if (selectedSeasonId === null && mediaItem) {
      const id = firstUnwatchedSeasonId(mediaItem);

      if (id) {
        setSelectedSeasonId(id);
      }
    }
  }, [mediaItem, selectedSeasonId]);

  return {
    selectedSeason:
      selectedSeasonId !== null && mediaItem
        ? mediaItem.seasons?.find((season) => season.id === selectedSeasonId)
        : null,
    selectedSeasonId: selectedSeasonId,
    setSelectedSeasonId: setSelectedSeasonId,
  };
};

export const hasBeenSeenAtLeastOnce = (mediaItem: MediaItemDetailsResponse) => {
  return mediaItem.seenHistory?.length > 0;
};
