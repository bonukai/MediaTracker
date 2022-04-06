import React, { FunctionComponent, useState } from 'react';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import { Trans } from '@lingui/macro';

import { markAsSeen } from 'src/api/details';
import { SelectLastSeenEpisode } from 'src/components/SelectLastSeenEpisode';

import {
  LastSeenAt,
  MediaItemItemsResponse,
  TvEpisode,
  TvSeason,
} from 'mediatracker-api';

import {
  formatEpisodeNumber,
  isAudiobook,
  isBook,
  isMovie,
  isTvShow,
  isVideoGame,
} from 'src/utils';

export const SelectSeenDate: FunctionComponent<{
  mediaItem: MediaItemItemsResponse;
  season?: TvSeason;
  episode?: TvEpisode;
  closeModal: (selected?: boolean) => void;
}> = (props) => {
  const { mediaItem, season, episode, closeModal } = props;

  if (mediaItem.mediaType === 'tv' && !episode) {
    return (
      <SelectLastSeenEpisode
        closeModal={closeModal}
        tvShow={mediaItem}
        season={season}
      />
    );
  }

  return (
    <SelectSeenDateComponent
      mediaItem={mediaItem}
      episode={episode}
      closeModal={closeModal}
      onSelected={async (args) => {
        closeModal();

        await markAsSeen({
          mediaItem: mediaItem,
          episode: episode,
          date: args.date,
          seenAt: args.seenAt,
        });
      }}
    />
  );
};

export const SelectSeenDateComponent: FunctionComponent<{
  mediaItem: MediaItemItemsResponse;
  episode?: TvEpisode;
  closeModal?: () => void;
  onSelected: (args?: { date?: Date; seenAt?: LastSeenAt }) => void;
}> = (props) => {
  const { mediaItem, episode, onSelected, closeModal } = props;
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <>
      <div className="max-w-sm mx-5 my-3 text-3xl font-bold text-center">
        {isAudiobook(mediaItem) && (
          <Trans>When did you listen to &quot;{mediaItem.title}&quot;?</Trans>
        )}

        {isBook(mediaItem) && (
          <Trans>When did you read &quot;{mediaItem.title}&quot;?</Trans>
        )}

        {isMovie(mediaItem) && (
          <Trans>When did you see &quot;{mediaItem.title}&quot;?</Trans>
        )}

        {isTvShow(mediaItem) && (
          <Trans>
            When did you see &quot;
            {episode
              ? `${mediaItem.title} ${formatEpisodeNumber(episode)}`
              : mediaItem.title}
            &quot;?
          </Trans>
        )}

        {isVideoGame(mediaItem) && (
          <Trans>When did you play &quot;{mediaItem.title}&quot;?</Trans>
        )}
      </div>
      <div className="flex flex-col">
        <div
          className="m-2 btn"
          onClick={() => onSelected({ date: new Date() })}
        >
          <Trans>Now</Trans>
        </div>
        <div
          className="m-2 btn"
          onClick={() => onSelected({ seenAt: 'release_date' })}
        >
          <Trans>At release date</Trans>
        </div>
        <div
          className="m-2 btn"
          onClick={() => onSelected({ seenAt: 'unknown' })}
        >
          <Trans>I do not remember</Trans>
        </div>
        <form
          className="m-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSelected({ date: selectedDate });
          }}
        >
          <input
            className="mx-1 w-min"
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            max={format(new Date(), 'yyyy-MM-dd')}
            onChange={(e) => {
              if (!e.target.value) {
                return;
              }

              const newDate = new Date(e.target.value);

              setSelectedDate(
                new Date(
                  newDate.getFullYear(),
                  newDate.getMonth(),
                  newDate.getDate(),
                  selectedDate.getHours(),
                  selectedDate.getMinutes(),
                  selectedDate.getSeconds()
                )
              );
            }}
          />
          <input
            className="mx-1 w-min"
            type="time"
            value={format(selectedDate, 'HH:mm')}
            max={
              format(selectedDate, 'yyyy-MM-dd') ===
              format(new Date(), 'yyyy-MM-dd')
                ? format(new Date(), 'HH:mm')
                : undefined
            }
            onChange={(e) => {
              if (!e.target.value) {
                return;
              }

              const newTime = parse(e.target.value, 'HH:mm', selectedDate);

              setSelectedDate(
                new Date(
                  selectedDate.getFullYear(),
                  selectedDate.getMonth(),
                  selectedDate.getDate(),
                  newTime.getHours(),
                  newTime.getMinutes(),
                  newTime.getSeconds()
                )
              );
            }}
          />
          <button className="btn">
            <Trans>Custom date</Trans>
          </button>
        </form>
        <div className="m-2 btn-red" onClick={() => closeModal()}>
          <Trans>Cancel</Trans>
        </div>
      </div>
    </>
  );
};
