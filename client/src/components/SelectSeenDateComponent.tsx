import { format, parseISO } from 'date-fns';
import { FC } from 'react';

import { Trans } from '@lingui/macro';

import {
  formatEpisodeNumber,
  hasReleaseDate,
  isAudiobook,
  isBook,
  isMovie,
  isTvShow,
  isVideoGame,
} from '../mediaItemHelpers';
import { Button } from './Button';
import { Form } from './Form';

import type {
  EpisodeResponse,
  MediaItemResponse,
} from '@server/entity/mediaItemModel';

export const SelectSeenDateComponent: FC<{
  mediaItem: MediaItemResponse;
  episode?: EpisodeResponse;
  closeModal?: () => void;
  onSelected: (args: { date: 'release_date' | Date | null }) => void;
}> = (props) => {
  const { mediaItem, episode, onSelected, closeModal } = props;
  const todayDateString = format(new Date(), 'yyyy-MM-dd');
  const itemReleaseDate = getItemReleaseDate({ mediaItem, episode });

  return (
    <div className="">
      <div className="max-w-sm mx-5 mb-6 text-xl font-bold text-center">
        {isAudiobook(mediaItem) && (
          <Trans>
            When did you listen to{' '}
            <span className="text-pink-600">{mediaItem.title}</span>?
          </Trans>
        )}

        {isBook(mediaItem) && (
          <Trans>
            When did you read{' '}
            <span className="text-pink-600">{mediaItem.title}</span>?
          </Trans>
        )}

        {isMovie(mediaItem) && (
          <Trans>
            When did you see{' '}
            <span className="text-pink-600">{mediaItem.title}</span>?
          </Trans>
        )}

        {isTvShow(mediaItem) && (
          <Trans>
            When did you see{' '}
            <span className="text-pink-600">
              {episode
                ? `${mediaItem.title} ${formatEpisodeNumber(episode)}`
                : mediaItem.title}
            </span>
            ?
          </Trans>
        )}

        {isVideoGame(mediaItem) && (
          <Trans>
            When did you play{' '}
            <span className="text-pink-600">{mediaItem.title}</span>?
          </Trans>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <Button
          text={<Trans>Now</Trans>}
          onClick={() => onSelected({ date: new Date() })}
        />
        {canUseAtReleaseButton({ mediaItem, episode }) && (
          <Button
            text={
              itemReleaseDate ? (
                <Trans>
                  At release date ({itemReleaseDate.toLocaleDateString()})
                </Trans>
              ) : (
                <Trans>At release date</Trans>
              )
            }
            onClick={() => onSelected({ date: 'release_date' })}
          />
        )}
        <Button
          text={<Trans>I do not remember</Trans>}
          onClick={() => onSelected({ date: null })}
        />
        <Form<{ date: string; time: string }>
          className="flex flex-wrap gap-2 my-1"
          onSubmit={({ data }) => {
            const [year, month, day] = data.date.split('-');
            const [hours, minutes] = data.time.split(':');

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
          {({ ref }) => (
            <>
              <input
                className="w-min"
                type="date"
                pattern="\d{4}-\d{2}-\d{2}"
                ref={ref('date')}
                defaultValue={todayDateString}
                max={todayDateString}
              />
              <input
                className="w-min"
                type="time"
                ref={ref('time')}
                defaultValue={'00:00'}
              />
              <div className="flex items-center flex-grow justify-stretch">
                <Button className="w-full" text={<Trans>Select date</Trans>} />
              </div>
            </>
          )}
        </Form>
        <Button
          type="secondary"
          color="red"
          text={<Trans>Cancel</Trans>}
          onClick={() => closeModal && closeModal()}
        />
      </div>
    </div>
  );
};

const canUseAtReleaseButton = (args: {
  mediaItem: MediaItemResponse;
  episode?: EpisodeResponse;
}): boolean => {
  const { mediaItem, episode } = args;

  if (isTvShow(mediaItem)) {
    if (!episode) {
      return hasReleaseDate(mediaItem);
    }

    return hasReleaseDate(episode);
  }

  return hasReleaseDate(mediaItem);
};

const getItemReleaseDate = (args: {
  mediaItem: MediaItemResponse;
  episode?: EpisodeResponse;
}): Date | undefined => {
  const { mediaItem, episode } = args;

  if (isTvShow(mediaItem)) {
    if (!episode) {
      return;
    }

    if (!hasReleaseDate(episode)) {
      return;
    }

    return parseISO(episode.releaseDate);
  }

  if (hasReleaseDate(mediaItem)) {
    return parseISO(mediaItem.releaseDate);
  }
};
