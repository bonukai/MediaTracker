import React, { FunctionComponent } from 'react';
import { useParams } from 'react-router';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Plural, t, Trans } from '@lingui/macro';
import { parseISO } from 'date-fns';

import { markAsUnseen, useDetails } from 'src/api/details';
import { Modal } from 'src/components/Modal';
import { Poster } from 'src/components/Poster';
import { SelectSeenDate } from 'src/components/SelectSeenDate';
import { BadgeRating } from 'src/components/StarRating';
import { hasBeenReleased, useSelectedSeason } from 'src/mediaItem';
import { canBeRated, hideEpisodeTitle, hideSeasonOverview } from 'src/utils';
import {
  MediaItemDetailsResponse,
  MediaItemItemsResponse,
  TvEpisode,
  TvSeason,
} from 'mediatracker-api';
import { useUser } from 'src/api/user';

const EpisodeComponent: FunctionComponent<{
  mediaItem: MediaItemItemsResponse;
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
            {episode.title}
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
          {canBeRated(episode) && (
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
      <div className="py-1 md:flex md:ml-auto md:py-0">
        <Modal
          openModal={(openModal) => (
            <div
              onClick={() => openModal()}
              className={clsx(
                'btn-blue text-sm',
                !hasBeenReleased(episode) && 'opacity-0 pointer-events-none'
              )}
            >
              <Trans>Add to seen history</Trans>
            </div>
          )}
        >
          {(closeModal) => (
            <SelectSeenDate
              closeModal={closeModal}
              mediaItem={mediaItem}
              episode={episode}
            />
          )}
        </Modal>

        <div
          className={clsx(
            'btn-red ml-2 text-sm',
            !episode.seen && 'opacity-0 pointer-events-none'
          )}
          onClick={() => {
            if (
              confirm(
                t`Do you want to remove episode ${episode.title} from seen history?`
              )
            ) {
              markAsUnseen({ mediaItem, episode });
            }
          }}
        >
          <Trans>Remove from seen history</Trans>
        </div>
      </div>
    </div>
  );
};

export const EpisodesPage: FunctionComponent = () => {
  const { mediaItemId } = useParams();
  const { mediaItem, isLoading, error } = useDetails(Number(mediaItemId));

  const { selectedSeason, selectedSeasonId, setSelectedSeasonId } =
    useSelectedSeason(mediaItem);

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
                    'bg-indigo-600': selectedSeasonId !== season.id,
                    'bg-red-500': selectedSeasonId === season.id,
                  }
                )}
                onClick={() => setSelectedSeasonId(season.id)}
              >
                <Trans>Season {season.seasonNumber}</Trans>
              </div>
            </div>
          ))}
        </div>
        <SeasonComponent
          key={selectedSeasonId}
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
      <div className="flex w-full">
        {season.episodes?.filter(
          (episode) =>
            episode.releaseDate && parseISO(episode.releaseDate) <= new Date()
        ).length > 0 && <BadgeRating mediaItem={mediaItem} season={season} />}

        <Modal
          openModal={(openModal) => (
            <div
              onClick={() => openModal()}
              className={clsx(
                'ml-auto btn-blue text-sm',
                season.episodes?.filter(
                  (episode) =>
                    episode.releaseDate &&
                    parseISO(episode.releaseDate) <= new Date()
                ).length === 0 && 'opacity-0 pointer-events-none'
              )}
            >
              <Trans>Add season to seen history</Trans>
            </div>
          )}
        >
          {(closeModal) => (
            <SelectSeenDate
              closeModal={closeModal}
              mediaItem={mediaItem}
              season={season}
            />
          )}
        </Modal>
      </div>
      <div className="flex flex-col my-2 md:flex-row">
        <div className="self-center w-60 shrink-0 md:mr-2 md:self-start">
          <Poster src={season.posterSmall} itemMediaType="tv" />
        </div>
        {season.description && (
          <div className="py-2">
            <b className="">
              <Trans>Description</Trans>:
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
