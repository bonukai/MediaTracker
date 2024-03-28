import { FC, useState } from 'react';

import { Trans } from '@lingui/macro';

import { useInvalidateMediaItem } from '../hooks/mediaItemHooks';
import { useUndoPopup } from '../hooks/useUndoPopup';
import { useUser } from '../hooks/useUser';
import { cx } from '../utils';
import { trpc } from '../utils/trpc';
import { StarFullIcon } from './Icons';

import type { MediaItemResponse } from '@server/entity/mediaItemModel';

export const StarRatingComponent: FC<{ mediaItem: MediaItemResponse }> = (
  props
) => {
  const { mediaItem } = props;
  const { user } = useUser();
  const [hoveredIndex, setHoveredIndex] = useState<number>();
  const { invalidateMediaItem, overrideSearchResponses } =
    useInvalidateMediaItem(mediaItem);
  const setRatingMutation = trpc.rating.rate.useMutation({
    onSuccess: invalidateMediaItem,
  });

  const { addPopup } = useUndoPopup();
  const rating = mediaItem.userRating?.rating;

  if (!user.data) {
    return <Trans>Loading</Trans>;
  }

  const { ratingSystem } = user.data.preferences;

  const ratingMultiplier = ratingSystem === '5-stars' ? 2 : 1;
  const numberOfStarts = ratingSystem === '5-stars' ? 5 : 10;

  return (
    <div className="flex">
      {new Array(numberOfStarts)
        .fill(null)
        .map((_value, index) => ({ value: (index + 1) * ratingMultiplier }))
        .map(({ value }) => (
          <StarComponent
            key={value}
            onMouseEnter={() => setHoveredIndex(value)}
            onMouseLeave={() => setHoveredIndex(undefined)}
            hovered={typeof hoveredIndex === 'number' && hoveredIndex >= value}
            belowOrEqualUserRating={
              typeof rating === 'number' && value <= rating
            }
            onClick={() => {
              const newRating = rating === value ? null : value;
              setRatingMutation.mutate({
                rating: { rating: newRating },
                mediaItemId: mediaItem.id,
                seasonId: null,
                episodeId: null,
              });
              overrideSearchResponses.setUserRating(mediaItem, {
                rating: newRating,
                date: null,
                review: null,
              });
              setHoveredIndex(undefined);
              addPopup({
                action: () =>
                  setRatingMutation.mutate({
                    rating: {
                      rating: mediaItem.userRating?.rating || null,
                    },
                    mediaItemId: mediaItem.id,
                    seasonId: null,
                    episodeId: null,
                  }),
                content: (() => {
                  const hasCurrentRating = typeof rating === 'number';
                  const hasNewRating = typeof newRating === 'number';

                  if (hasCurrentRating) {
                    if (hasNewRating) {
                      return (
                        <Trans>
                          Rating for{' '}
                          <span className="font-semibold">
                            {mediaItem.title}
                          </span>{' '}
                          has been changed from{' '}
                          <span className="font-semibold">
                            {rating / ratingMultiplier}
                          </span>{' '}
                          to{' '}
                          <span className="font-semibold">
                            {newRating / ratingMultiplier}
                          </span>
                        </Trans>
                      );
                    } else {
                      return (
                        <Trans>
                          Rating of{' '}
                          <span className="font-semibold">
                            {rating / ratingMultiplier}
                          </span>{' '}
                          for{' '}
                          <span className="font-semibold">
                            {mediaItem.title}
                          </span>{' '}
                          has been removed
                        </Trans>
                      );
                    }
                  } else {
                    if (hasNewRating) {
                      return (
                        <Trans>
                          <span className="font-semibold">
                            {mediaItem.title}
                          </span>{' '}
                          has been rated to{' '}
                          <span className="font-semibold">
                            {newRating / ratingMultiplier}
                          </span>
                        </Trans>
                      );
                    } else {
                      return <></>;
                    }
                  }
                })(),
              });
            }}
          />
        ))}
    </div>
  );
};

const StarComponent: FC<{
  belowOrEqualUserRating: boolean;
  hovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}> = (props) => {
  const {
    belowOrEqualUserRating,
    hovered,
    onMouseEnter,
    onMouseLeave,
    onClick,
  } = props;

  return (
    <StarFullIcon
      className={cx(
        'h-8 w-min hover:cursor-pointer',
        hovered
          ? 'fill-[#EB3810]'
          : belowOrEqualUserRating
            ? 'fill-[#FF9B26] '
            : 'fill-stone-400'
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
    />
  );
};
