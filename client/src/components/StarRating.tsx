import React, { FunctionComponent, useState } from 'react';
import clsx from 'clsx';
import { Trans } from '@lingui/macro';

import { MediaItemItemsResponse, TvEpisode, TvSeason } from 'mediatracker-api';
import { setRating } from 'src/api/details';
import { Modal, useOpenModalRef } from 'src/components/Modal';
import { SelectSeenDate } from 'src/components/SelectSeenDate';
import { formatEpisodeNumber, formatSeasonNumber } from 'src/utils';
import { queryClient } from 'src/App';

export const StarRating: FunctionComponent<
  | { mediaItem: MediaItemItemsResponse }
  | { mediaItem: MediaItemItemsResponse; season: TvSeason }
  | { mediaItem: MediaItemItemsResponse; episode: TvEpisode }
> = (props) => {
  const { mediaItem, season, episode } = {
    season: undefined,
    episode: undefined,
    ...props,
  };
  const rating: number = episode
    ? episode.userRating?.rating
    : season
    ? season.userRating?.rating
    : mediaItem.userRating?.rating;

  const [hoverIndex, setHoverIndex] = useState(null);

  const _setRating = (value: number) =>
    setRating({
      mediaItem: mediaItem,
      season: season,
      episode: episode,
      rating: value,
    });

  return (
    <span className="flex cursor-pointer w-min">
      {new Array(5).fill(null).map((value, index) => {
        return (
          <span
            key={index}
            onClick={(e) => {
              e.preventDefault();
              _setRating(index + 1);
            }}
            onPointerEnter={() => setHoverIndex(index + 1)}
            onPointerLeave={() => setHoverIndex(null)}
            className={clsx(
              'material-icons hover:text-yellow-400 select-none',
              {
                'text-yellow-400': index < rating || index < hoverIndex,
              }
            )}
          >
            {index < rating && (!hoverIndex || index < hoverIndex)
              ? 'star'
              : 'star_border'}
          </span>
        );
      })}
    </span>
  );
};

const StarRatingModal: FunctionComponent<
  { closeModal: (rating?: number) => void } & (
    | { mediaItem: MediaItemItemsResponse }
    | { mediaItem: MediaItemItemsResponse; season: TvSeason }
    | { mediaItem: MediaItemItemsResponse; episode: TvEpisode }
  )
> = (props) => {
  const { closeModal, mediaItem, season, episode } = {
    season: undefined,
    episode: undefined,
    ...props,
  };

  const rating: number = episode
    ? episode.userRating?.rating
    : season
    ? season.userRating?.rating
    : mediaItem.userRating?.rating;

  const [hoverIndex, setHoverIndex] = useState(null);
  const [review, setReview] = useState(
    (episode
      ? episode.userRating?.review
      : season
      ? season.userRating?.review
      : mediaItem.userRating?.review) || ''
  );

  const onSetRating = async (value?: number) => {
    setRating({
      mediaItem: mediaItem,
      season: season,
      episode: episode,
      rating: value,
    });
  };

  const _closeModal = () => {
    closeModal();
    queryClient.invalidateQueries(['items']);
    queryClient.invalidateQueries(['list']);
  };

  return (
    <div className="flex flex-col items-center justify-center p-3 text-black select-none bottom-full min-w-max w-96">
      <div className="pb-2 text-4xl font-bold">
        {mediaItem.title}
        {season && <> {formatSeasonNumber(season)}</>}
        {episode && <> {formatEpisodeNumber(episode)}</>}
      </div>

      <span className="flex px-1 m-auto cursor-pointer w-min dark:text-slate-200">
        {new Array(5).fill(null).map((value, index) => {
          return (
            <span
              key={index}
              onClick={(e) => {
                e.preventDefault();

                if (index + 1 === rating) {
                  onSetRating(null);
                } else {
                  onSetRating(index + 1);
                }
              }}
              onPointerEnter={() => setHoverIndex(index + 1)}
              onPointerLeave={() => setHoverIndex(null)}
              className={clsx(
                'material-icons select-none hover:text-yellow-400 text-2xl',
                (index < rating || index < hoverIndex) && 'text-yellow-400'
              )}
            >
              {index < rating && (!hoverIndex || index < hoverIndex)
                ? 'star'
                : 'star_border'}
            </span>
          );
        })}
      </span>
      <form
        className="w-full mt-4"
        onSubmit={async (e) => {
          e.preventDefault();
          _closeModal();

          await setRating({
            mediaItem: mediaItem,
            season: season,
            episode: episode,
            review: review,
          });
        }}
      >
        <textarea
          className="w-full resize-none h-80"
          value={review}
          onChange={(e) => setReview(e.currentTarget.value)}
        />
        <div className="flex w-full">
          <button className="btn-blue">
            <Trans>Save review</Trans>
          </button>
          <div className="ml-auto btn-red" onClick={() => _closeModal()}>
            <Trans>Cancel</Trans>
          </div>
        </div>
      </form>
    </div>
  );
};

export const BadgeRating: FunctionComponent<
  | { mediaItem: MediaItemItemsResponse }
  | { mediaItem: MediaItemItemsResponse; season: TvSeason }
  | { mediaItem: MediaItemItemsResponse; episode: TvEpisode }
> = (props) => {
  const { mediaItem, season, episode } = {
    season: undefined,
    episode: undefined,
    ...props,
  };

  const rating: number = episode
    ? episode.userRating?.rating
    : season
    ? season.userRating?.rating
    : mediaItem.userRating?.rating;

  const seen = episode
    ? episode.seen === true
    : season
    ? season.seen === true
    : mediaItem.seen === true;

  const openModal2 = useOpenModalRef();

  return (
    <>
      <Modal
        onBeforeClosed={(e) => e && !seen && openModal2.current.open()}
        openModal={(openModal) => (
          <>
            <span
              className="flex w-min px-0.5 bg-gray-400 rounded shadow-lg cursor-pointer text-lg relative text-black select-none"
              onClick={() => openModal()}
            >
              <span
                className={clsx([
                  'material-icons hover:text-yellow-400',
                  rating && 'text-yellow-400',
                ])}
              >
                star
              </span>
              {rating && <span className="px-0.5 font-bold">{rating}</span>}
            </span>

            <Modal openModalRef={openModal2}>
              {(closeModal) => (
                <>
                  <SelectSeenDate
                    closeModal={closeModal}
                    mediaItem={mediaItem}
                    season={season}
                    episode={episode}
                  />
                </>
              )}
            </Modal>
          </>
        )}
      >
        {(closeModal) => (
          <StarRatingModal
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
