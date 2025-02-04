import React, { FunctionComponent } from 'react';
import { useParams } from 'react-router-dom';
import { Trans } from '@lingui/macro';
import { useDetails } from 'src/api/details';
import {
  findEpisodeBySeasonAndEpisodeNumber,
  hasBeenSeenAtLeastOnce,
  originalAndTranslatedTitle,
} from 'src/mediaItem';
import {
  formatEpisodeNumber,
  hasBeenReleased,
  hasReleaseDate,
  hideEpisodeTitle,
} from 'src/utils';
import { useUser } from 'src/api/user';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { parseISO } from 'date-fns';
import { AddToListButtonWithModal } from 'src/components/AddToListModal';
import {
  AddToSeenHistoryButton,
  RemoveFromSeenHistoryButton,
} from 'src/components/AddAndRemoveFromSeenHistoryButton';

export const EpisodePage: FunctionComponent = () => {
  const { mediaItemId, seasonNumber, episodeNumber } = useParams();

  const { user } = useUser();
  const { mediaItem } = useDetails(Number(mediaItemId));

  const episode = findEpisodeBySeasonAndEpisodeNumber(
    mediaItem,
    Number(seasonNumber),
    Number(episodeNumber)
  );

  if (mediaItem && !episode) {
    throw new Error('Invalid episode number');
  }

  if (!mediaItem) {
    return <Trans>Loading</Trans>;
  }

  return (
    <div>
      <Link className="text-2xl font-bold" to={`/details/${mediaItem.id}`}>
        {originalAndTranslatedTitle(mediaItem)} {formatEpisodeNumber(episode)}
      </Link>
      {episode.description && (
        <div className="pt-2">
          <b className="">
            <Trans>Description</Trans>:{' '}
          </b>
          <div
            className={clsx(
              'inline py-1',
              hideEpisodeTitle(user) &&
                !episode.seen &&
                'bg-current hover:bg-transparent transition-all cursor-pointer'
            )}
          >
            {episode.description}
          </div>
        </div>
      )}

      {episode.runtime && (
        <div className="pt-2">
          <b className="">
            <Trans>Runtime</Trans>:{' '}
          </b>
          {episode.runtime}
        </div>
      )}

      {episode.releaseDate && (
        <div className="pt-2">
          <b className="">
            <Trans>Release date</Trans>:{' '}
          </b>
          {parseISO(episode.releaseDate).toLocaleDateString()}
        </div>
      )}

      <div className="mt-3">
        <AddToListButtonWithModal
          mediaItemId={mediaItem.id}
          episodeId={episode.id}
        />
      </div>

      {(hasBeenReleased(episode) || !hasReleaseDate(mediaItem)) && (
        <>
          <div className="mt-3">
            <AddToSeenHistoryButton mediaItem={mediaItem} episode={episode} />
          </div>
          {hasBeenSeenAtLeastOnce(episode) && (
            <div className="mt-3">
              <RemoveFromSeenHistoryButton
                mediaItem={mediaItem}
                episode={episode}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
