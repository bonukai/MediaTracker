import React, { FunctionComponent, useEffect } from 'react';
import { useLocation, useMatch, useNavigate, useParams } from 'react-router';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Plural, t, Trans } from '@lingui/macro';
import { parseISO } from 'date-fns';

import { markAsUnseen, useDetails } from 'src/api/details';
import { Modal } from 'src/components/Modal';
import { Poster } from 'src/components/Poster';
import { SelectSeenDate } from 'src/components/SelectSeenDate';
import { BadgeRating } from 'src/components/StarRating';
import { hasBeenSeenAtLeastOnce, useSelectedSeason } from 'src/mediaItem';
import {
  hasBeenReleased,
  hideEpisodeTitle,
  hideSeasonOverview,
} from 'src/utils';
import {
  MediaItemDetailsResponse,
  TvEpisode,
  TvSeason,
} from 'mediatracker-api';
import { useUser } from 'src/api/user';
import { AddToListButtonWithModal } from 'src/components/AddToListModal';
import {
  AddToSeenHistoryButton,
  RemoveFromSeenHistoryButton,
} from 'src/components/AddAndRemoveFromSeenHistoryButton';

const EpisodeComponent: FunctionComponent<{
  mediaItem: MediaItemDetailsResponse;
  episode: TvEpisode;
}> = (props) => {
  const { mediaItem, episode } = props;
  const { user } = useUser();

  return (
    <div
      key={episode.id}
      className="flex flex-col w-full my-1 md:items-center md:flex-row"
    >
      {/* First row */}
      <div className="flex w-full">
        {/* Episode number */}
        <div className="w-8 pr-2">{episode.episodeNumber}</div>

        {/* Title */}
        <div className="flex-grow w-1 mr-2 overflow-hidden overflow-ellipsis">
          <span
            className={clsx({
              'bg-current hover:bg-transparent cursor-pointer transition-all':
                hideEpisodeTitle(user) &&
                (!episode.seenHistory || episode.seenHistory?.length === 0),
            })}
          >
            <Link
              to={`/episode/${episode.tvShowId}/${episode.seasonNumber}/${episode.episodeNumber}`}
            >
              {episode.title}
            </Link>
          </span>
        </div>

        {/* Release date */}
        <div className="flex items-center pr-2">
          {episode.releaseDate && (
            <>
              <div className="text-sm italic">
                {parseISO(episode.releaseDate).toLocaleDateString()}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Second row */}
      <div className="flex py-2 md:ml-auto md:py-0">
        {/* Rating */}
        <div className="flex w-10 md:justify-center">
          {hasBeenReleased(episode) && (
            <BadgeRating mediaItem={mediaItem} episode={episode} />
          )}
        </div>

        <div className="w-28">
          {episode.seenHistory?.length > 0 && (
            <Plural
              value={episode.seenHistory.length}
              one="Seen 1 time"
              other="Seen # times"
            />
          )}
        </div>
      </div>

      {/* Third row */}
      <div className="flex flex-wrap py-1 -mt-2 sm:flex-nowrap md:ml-auto md:py-0">
        <div className="mt-2">
          <AddToSeenHistoryButton mediaItem={mediaItem} episode={episode} />
        </div>

        <div className="ml-2" />

        <div
          className={
            hasBeenSeenAtLeastOnce(episode) ? 'mt-2' : 'invisible h-0 '
          }
        >
          <RemoveFromSeenHistoryButton
            mediaItem={mediaItem}
            episode={episode}
          />
        </div>
      </div>
    </div>
  );
};

export const SeasonsPage: FunctionComponent = () => {
  const { mediaItemId, seasonNumber } = useParams();
  const { mediaItem, isLoading, error } = useDetails(Number(mediaItemId));

  const { selectedSeason, selectedSeasonNumber, setSelectedSeasonNumber } =
    useSelectedSeason(mediaItem);

  const navigate = useNavigate();

  useEffect(
    () => seasonNumber && setSelectedSeasonNumber(Number(seasonNumber)),
    [seasonNumber, setSelectedSeasonNumber]
  );

  useEffect(
    () =>
      selectedSeasonNumber !== undefined &&
      navigate(`/seasons/${mediaItemId}/${selectedSeasonNumber}`, {
        replace: true,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedSeasonNumber]
  );

  if (isLoading || !selectedSeason) {
    return <Trans>Loading</Trans>;
  }

  if (error) {
    return <>{error}</>;
  }

  if (mediaItem && mediaItem.mediaType !== 'tv') {
    throw new Error(t`This component can only be used with tv shows`);
  }

  return (
    <>
      <div className="sm:w-full">
        <div className="flex w-full">
          <Link className="text-2xl font-bold" to={`/details/${mediaItem.id}`}>
            {mediaItem.title}
          </Link>
        </div>
        <div className="flex flex-row flex-wrap w-full">
          {mediaItem.seasons?.map((season) => (
            <div key={season.id}>
              <div
                className={clsx(
                  'mr-1 my-1 px-2 py-0.5 hover:bg-blue-300 rounded cursor-pointer select-none',
                  {
                    'bg-indigo-600':
                      selectedSeasonNumber !== season.seasonNumber,
                    'bg-red-500': selectedSeasonNumber === season.seasonNumber,
                  }
                )}
                onClick={() => setSelectedSeasonNumber(season.seasonNumber)}
              >
                <Trans>Season {season.seasonNumber}</Trans>
              </div>
            </div>
          ))}
        </div>
        <SeasonComponent
          key={selectedSeasonNumber}
          mediaItem={mediaItem}
          season={selectedSeason}
        />
      </div>
    </>
  );
};

const SeasonComponent: FunctionComponent<{
  mediaItem: MediaItemDetailsResponse;
  season: TvSeason;
}> = (props) => {
  const { mediaItem, season } = props;
  const { user } = useUser();

  return (
    <>
      <div className="flex flex-col my-2 md:flex-row">
        <div className="self-center w-60 shrink-0 md:mr-2 md:self-start">
          <Poster src={season.posterSmall} itemMediaType="tv" />
        </div>
        <div>
          {season.description && (
            <div className="pt-2">
              <b className="">
                <Trans>Description</Trans>:{' '}
              </b>
              <div
                className={clsx(
                  'inline py-1',
                  hideSeasonOverview(user) &&
                    !season.seen &&
                    'bg-current hover:bg-transparent transition-all cursor-pointer'
                )}
              >
                {season.description}
              </div>
            </div>
          )}
          {season.episodes?.length > 0 && (
            <>
              <b>
                <Trans>Number of episodes</Trans>:{' '}
              </b>
              {season.episodes.length}
            </>
          )}

          <div className="mt-2">
            {hasBeenReleased(season) && (
              <BadgeRating mediaItem={mediaItem} season={season} />
            )}
          </div>

          <div className="mt-2">
            <AddToSeenHistoryButton mediaItem={mediaItem} season={season} />
          </div>

          {hasBeenSeenAtLeastOnce(season) && (
            <div className="mt-2">
              <RemoveFromSeenHistoryButton
                mediaItem={mediaItem}
                season={season}
              />
            </div>
          )}

          <div className="mt-2">
            <AddToListButtonWithModal
              mediaItemId={mediaItem.id}
              seasonId={season.id}
            />
          </div>
        </div>
      </div>
      <div className="w-full whitespace-nowrap">
        {season.episodes.map((episode, index) => (
          <div
            key={episode.id}
            className={clsx({
              'border-b border-gray-600/30 dark:border-neutral-300/30':
                index !== season.episodes.length - 1,
            })}
          >
            <EpisodeComponent mediaItem={mediaItem} episode={episode} />
          </div>
        ))}
      </div>
    </>
  );
};
