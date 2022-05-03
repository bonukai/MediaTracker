import React, { FunctionComponent } from 'react';
import { plural, Trans } from '@lingui/macro';

import {
  MediaItemDetailsResponse,
  MediaItemItemsResponse,
  TvEpisode,
  TvSeason,
} from 'mediatracker-api';
import {
  formatEpisodeNumber,
  formatSeasonNumber,
  isAudiobook,
  isBook,
  isMovie,
  isTvShow,
  isVideoGame,
} from 'src/utils';
import { Modal } from 'src/components/Modal';
import { SelectSeenDate } from 'src/components/SelectSeenDate';
import { markAsUnseen } from 'src/api/details';

export const AddToSeenHistoryButton: FunctionComponent<{
  mediaItem: MediaItemItemsResponse;
  season?: TvSeason;
  episode?: TvEpisode;
  useSeasonAndEpisodeNumber?: boolean;
}> = (props) => {
  const { mediaItem, season, episode, useSeasonAndEpisodeNumber } = {
    useSeasonAndEpisodeNumber: false,
    ...props,
  };

  return (
    <>
      <Modal
        openModal={(openModal) => (
          <div className="text-sm btn-blue bg" onClick={openModal}>
            {isAudiobook(mediaItem) && <Trans>Add to listened history</Trans>}
            {isBook(mediaItem) && <Trans>Add to read history</Trans>}
            {isVideoGame(mediaItem) && <Trans>Add to played history</Trans>}
            {isMovie(mediaItem) && <Trans>Add to seen history</Trans>}
            {isTvShow(mediaItem) &&
              (useSeasonAndEpisodeNumber ? (
                episode ? (
                  <Trans>
                    Add {formatEpisodeNumber(episode)} to seen history
                  </Trans>
                ) : season ? (
                  <Trans>
                    Add {formatSeasonNumber(season)} to seen history
                  </Trans>
                ) : (
                  <Trans>Add to seen history</Trans>
                )
              ) : episode ? (
                <Trans>Add episode to seen history</Trans>
              ) : season ? (
                <Trans>Add season to seen history</Trans>
              ) : (
                <Trans>Add to seen history</Trans>
              ))}
          </div>
        )}
      >
        {(closeModal) => (
          <SelectSeenDate
            mediaItem={mediaItem}
            season={season}
            episode={episode}
            closeModal={closeModal}
          />
        )}
      </Modal>
    </>
  );
};

export const RemoveFromSeenHistoryButton: FunctionComponent<{
  mediaItem: MediaItemDetailsResponse;
  season?: TvSeason;
  episode?: TvEpisode;
}> = (props) => {
  const { mediaItem, season, episode } = props;

  const seasonEpisodesIdSet = new Set(
    season?.episodes?.map((episode) => episode.id)
  );

  const count = episode
    ? mediaItem.seenHistory?.filter((entry) => entry.episodeId === episode?.id)
        .length
    : season
    ? mediaItem.seenHistory?.filter((entry) =>
        seasonEpisodesIdSet.has(entry.episodeId)
      ).length
    : mediaItem.seenHistory?.length;

  return (
    <div
      className="text-sm btn-red"
      onClick={() =>
        confirm(
          plural(count, {
            one: 'Do you want to remove # seen history entry?',
            other: 'Do you want to remove all # seen history entries?',
          })
        ) &&
        markAsUnseen({
          mediaItem: mediaItem,
          season: season,
          episode: episode,
        })
      }
    >
      {isAudiobook(mediaItem) && <Trans>Remove from listened history</Trans>}
      {isBook(mediaItem) && <Trans>Remove from read history</Trans>}
      {isVideoGame(mediaItem) && <Trans>Remove from played history</Trans>}
      {isMovie(mediaItem) && <Trans>Remove from seen history</Trans>}
      {isTvShow(mediaItem) &&
        (episode ? (
          <Trans>Remove episode from seen history</Trans>
        ) : season ? (
          <Trans>Remove season from seen history</Trans>
        ) : (
          <Trans>Remove from seen history</Trans>
        ))}
    </div>
  );
};
