import React, { FunctionComponent, useState } from 'react';
import { Plural, Trans } from '@lingui/macro';

import { detailsKey } from 'src/api/details';

import { MediaItemItemsResponse, MediaType } from 'mediatracker-api';

import { isAudiobook, isBook, isMovie, isVideoGame } from 'src/utils';
import { mediaTrackerApi } from 'src/api/api';
import { queryClient } from 'src/App';

const InputComponent: FunctionComponent<{
  max: number;
  progress: number;
  setProgress: (value: number) => void;
  mediaType: MediaType;
}> = (props) => {
  const { max, setProgress, progress, mediaType } = props;
  const value = Math.floor((max * progress) / 100);

  return (
    <div>
      <label>
        <input
          type="number"
          min={0}
          max={max}
          value={value}
          onChange={(e) => {
            setProgress(Number((Number(e.currentTarget.value) / max) * 100));
          }}
        />{' '}
        {isBook(mediaType) && <Plural value={value} one="page" other="pages" />}
        {(isAudiobook(mediaType) || isMovie(mediaType)) && (
          <Plural value={value} one="minute" other="minutes" />
        )}
      </label>
    </div>
  );
};

export const SetProgressComponent: FunctionComponent<{
  mediaItem: MediaItemItemsResponse;
  closeModal?: () => void;
}> = (props) => {
  const { mediaItem, closeModal } = props;
  const [progress, setProgress] = useState(mediaItem.progress * 100 || 0);
  const [duration, setDuration] = useState(0);

  return (
    <div className="p-3">
      <div className="my-1 text-3xl font-bold text-center">
        <Trans>Set progress</Trans>
      </div>
      <div className="flex flex-col mt-4">
        {isBook(mediaItem) && mediaItem.numberOfPages && (
          <InputComponent
            max={mediaItem.numberOfPages}
            progress={progress}
            setProgress={setProgress}
            mediaType={mediaItem.mediaType}
          />
        )}

        {(isAudiobook(mediaItem) || isMovie(mediaItem)) &&
          mediaItem.runtime && (
            <InputComponent
              max={mediaItem.runtime}
              progress={progress}
              setProgress={setProgress}
              mediaType={mediaItem.mediaType}
            />
          )}

        <input
          className="w-64 my-2"
          type="range"
          value={progress}
          min={0}
          max={100}
          onChange={(e) => {
            setProgress(Number(e.currentTarget.value));
          }}
        />

        {isVideoGame(mediaItem) && (
          <div className="mb-4">
            <div className="text-lg">
              <Trans>Duration</Trans>:
            </div>
            <label>
              <input
                type="number"
                min={0}
                value={duration}
                onChange={(e) => {
                  setDuration(Number(e.currentTarget.value));
                }}
              />{' '}
              <Plural value={duration} one="minute" other="minutes" />
            </label>
          </div>
        )}

        <div
          className="w-full btn"
          onClick={async () => {
            await mediaTrackerApi.progress.add({
              mediaItemId: mediaItem.id,
              date: new Date().getTime(),
              progress: progress / 100,
            });
            queryClient.invalidateQueries(detailsKey(mediaItem.id));
            queryClient.invalidateQueries(['items']);
            closeModal();
          }}
        >
          <Trans>Set</Trans>
        </div>
      </div>
      <div className="w-full mt-3 btn-red" onClick={() => closeModal()}>
        <Trans>Cancel</Trans>
      </div>
    </div>
  );
};
