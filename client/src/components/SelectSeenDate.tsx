import React, { FunctionComponent, useState } from 'react';
import format from 'date-fns/format';
import parse from 'date-fns/parse';

import { markAsSeen } from 'src/api/details';
import { SelectLastSeenEpisode } from 'src/components/SelectLastSeenEpisode';

import {
  LastSeenAt,
  MediaItemItemsResponse,
  TvEpisode,
  TvSeason,
} from 'mediatracker-api';

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
  closeModal?: () => void;
  onSelected: (args?: { date?: Date; seenAt?: LastSeenAt }) => void;
}> = (props) => {
  const { onSelected, closeModal } = props;
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <>
      <div className="my-3 text-3xl font-bold text-center">
        When did you seen it?
      </div>
      <div className="flex flex-col">
        <div
          className="m-2 btn"
          onClick={() => onSelected({ date: new Date() })}
        >
          Now
        </div>
        <div
          className="m-2 btn"
          onClick={() => onSelected({ seenAt: 'release_date' })}
        >
          At release date
        </div>
        <div
          className="m-2 btn"
          onClick={() => onSelected({ seenAt: 'unknown' })}
        >
          I do not remember
        </div>
        <div className="m-2">
          <input
            className="mx-1 w-min"
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
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
          <div
            className="btn"
            onClick={() => onSelected({ date: selectedDate })}
          >
            Custom date
          </div>
        </div>
        <div className="m-2 btn-red" onClick={() => closeModal()}>
          Cancel
        </div>
      </div>
    </>
  );
};
