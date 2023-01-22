import React, { FunctionComponent, useRef } from 'react';
import format from 'date-fns/format';
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
  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  const todayDateString = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="p-2">
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
          className="flex flex-wrap mx-2 my-1 mb-2"
          onSubmit={(e) => {
            e.preventDefault();

            const [year, month, day] = dateInputRef.current.value.split('-');
            const [hours, minutes] = timeInputRef.current.value.split(':');

            onSelected({
              date: new Date(
                Number(year),
                Number(month) - 1,
                Number(day),
                Number(hours),
                Number(minutes)
              ),
            });
          }}
        >
          <input
            className="mx-1 mt-1 w-min"
            type="date"
            pattern="\d{4}-\d{2}-\d{2}"
            ref={dateInputRef}
            defaultValue={todayDateString}
            max={todayDateString}
            onChange={() => {
              if (dateInputRef.current.value !== todayDateString) {
                timeInputRef.current.value = '00:00';
              }
            }}
          />
          <input
            className="mx-1 mt-1 w-min"
            type="time"
            ref={timeInputRef}
            defaultValue={format(new Date(), 'HH:mm')}
          />
          <button className="flex-grow mt-1 btn">
            <Trans>Select date</Trans>
          </button>
        </form>
        <div className="m-2 btn-red" onClick={() => closeModal()}>
          <Trans>Cancel</Trans>
        </div>
      </div>
    </div>
  );
};
