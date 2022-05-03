import { useState, useEffect } from 'react';

import {
  MediaItemDetailsResponse,
  TvEpisode,
  TvSeason,
} from 'mediatracker-api';
import { isSeason } from 'src/utils';

export const firstUnwatchedSeason = (
  mediaItem: MediaItemDetailsResponse
): TvSeason => {
  return mediaItem.seasons
    ?.filter((season) => !season.isSpecialSeason)
    ?.find((season) => season.seen === false);
};

export const lastSeason = (mediaItem: MediaItemDetailsResponse): TvSeason => {
  return mediaItem?.seasons?.at(mediaItem.seasons?.length - 1);
};

export const findSeasonBySeasonNumber = (
  mediaItem: MediaItemDetailsResponse,
  seasonNumber: number
): TvSeason => {
  return mediaItem?.seasons?.find(
    (season) => season.seasonNumber === seasonNumber
  );
};

export const findEpisodeBySeasonAndEpisodeNumber = (
  mediaItem: MediaItemDetailsResponse,
  seasonNumber: number,
  episodeNumber: number
): TvEpisode => {
  return findSeasonBySeasonNumber(mediaItem, seasonNumber)?.episodes?.find(
    (episode) => episode.episodeNumber === episodeNumber
  );
};

export const useSelectedSeason = (mediaItem?: MediaItemDetailsResponse) => {
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(undefined);

  useEffect(() => {
    if (selectedSeasonNumber === undefined && mediaItem) {
      const seasonNumber = (
        firstUnwatchedSeason(mediaItem) || lastSeason(mediaItem)
      )?.seasonNumber;

      if (seasonNumber) {
        setSelectedSeasonNumber(seasonNumber);
      }
    }
  }, [mediaItem, selectedSeasonNumber]);

  return {
    selectedSeason:
      mediaItem && selectedSeasonNumber !== null
        ? findSeasonBySeasonNumber(mediaItem, selectedSeasonNumber)
        : undefined,
    selectedSeasonNumber: selectedSeasonNumber,
    setSelectedSeasonNumber: setSelectedSeasonNumber,
  };
};

export const hasBeenSeenAtLeastOnce = (
  value: MediaItemDetailsResponse | TvSeason | TvEpisode
) => {
  return isSeason(value)
    ? value.episodes?.filter((episode) => episode.seenHistory?.length > 0)
        ?.length > 0
    : value.seenHistory?.length > 0;
};
