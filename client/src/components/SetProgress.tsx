import React, { FunctionComponent, useState, useEffect } from 'react';
import { Plural, Trans } from '@lingui/macro';

import { MediaItemItemsResponse, MediaType } from 'mediatracker-api';
import { addToProgress } from 'src/api/details';
import { isAudiobook, isBook, isMovie, isMusic, isVideoGame } from 'src/utils';

const InputComponent: FunctionComponent<{
  max: number;
  progress: number;
  setProgress: (value: number) => void;
  mediaType: MediaType;
}> = (props) => {
  const { max, setProgress, progress, mediaType } = props;
  const [value, setValue] = useState<number | ''>(0);

  useEffect(() => {
    const newValue = Math.round((max * progress) / 100);
    Math.abs(progress - newValue) > 0.001 && setValue(newValue);
  }, [max, progress]);

  return (
    <div>
      <label>
        <input
          type="number"
          min={0}
          max={max}
          value={value}
          onChange={(e) => {
            const newValue = Math.min(Number(e.currentTarget.value), max);
            if (e.currentTarget.value === '') {
              setValue('');
            } else {
              setValue(newValue);
            }
            setProgress(Number((newValue / max) * 100));
          }}
        />{' '}
        {isBook(mediaType) && <Plural value={value} one="page" other="pages" />}
        {(isAudiobook(mediaType) || isMovie(mediaType) || isMusic(mediaType)) && (
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
      <form
        className="flex flex-col mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          addToProgress({
            mediaItemId: mediaItem.id,
            progress: progress / 100,
            duration: duration,
          });
          closeModal();
        }}
      >
        {isBook(mediaItem) && mediaItem.numberOfPages && (
          <InputComponent
            max={mediaItem.numberOfPages}
            progress={progress}
            setProgress={setProgress}
            mediaType={mediaItem.mediaType}
          />
        )}

        {(isAudiobook(mediaItem) || isMovie(mediaItem) || isMusic(mediaItem)) &&
          mediaItem.runtime && (
            <InputComponent
              max={mediaItem.runtime}
              progress={progress}
              setProgress={setProgress}
              mediaType={mediaItem.mediaType}
            />
          )}
        <div className="flex items-center">
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
          <span className="w-10 text-right">{Math.round(progress)}%</span>
        </div>

        {(isVideoGame(mediaItem) || isBook(mediaItem)) && (
          <div className="mb-4">
            <div className="text-lg">
              <Trans>Duration</Trans>:
            </div>
            <label>
              <input
                type="number"
                min={0}
                value={duration}
                onChange={(e) => setDuration(Number(e.currentTarget.value))}
              />{' '}
              <Plural value={duration} one="minute" other="minutes" />
            </label>
          </div>
        )}

        <button className="w-full btn">
          <Trans>Set</Trans>
        </button>
      </form>
      <div className="w-full mt-3 btn-red" onClick={() => closeModal()}>
        <Trans>Cancel</Trans>
      </div>
    </div>
  );
};
