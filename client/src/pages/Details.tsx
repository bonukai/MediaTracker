import React, { FunctionComponent } from 'react';
import { Link, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { formatDuration, intervalToDuration } from 'date-fns';

import {
  MediaItemDetailsResponse,
  MediaItemItemsResponse,
  TvEpisode,
  TvSeason,
  UserRating,
} from 'mediatracker-api';
import { SelectSeenDate } from 'src/components/SelectSeenDate';
import { BadgeRating } from 'src/components/StarRating';
import { hasBeenReleased, hasBeenSeenAtLeastOnce } from 'src/mediaItem';
import {
  canBeOnWatchlist,
  canBeRated,
  formatEpisodeNumber,
  isTvShow,
} from 'src/utils';
import {
  addToWatchlist,
  removeFromSeenHistory,
  removeFromWatchlist,
  useDetails,
} from 'src/api/details';
import { relativeTimeTo } from 'src/date';
import { Poster } from 'src/components/Poster';
import { Modal } from 'src/components/Modal';
import { useOtherUser } from 'src/api/user';

const Review: FunctionComponent<{ userRating: UserRating }> = (props) => {
  const { userRating } = props;
  const { user: author, isLoading } = useOtherUser(userRating.userId);

  if (isLoading) {
    return <></>;
  }

  return (
    <>
      <div className="">
        Review from <span className="italic font-bold">{author.name}</span> at{' '}
        {new Date(userRating.date).toLocaleString()}
      </div>
      <div className="">{userRating.review}</div>
    </>
  );
};

const RatingAndReview: FunctionComponent<{
  userRating: UserRating;
  mediaItem: MediaItemItemsResponse;
  season?: TvSeason;
  episode?: TvEpisode;
}> = (props) => {
  const { userRating, mediaItem, season, episode } = props;

  return (
    <>
      <div className="mt-3">
        <BadgeRating mediaItem={mediaItem} season={season} episode={episode} />
      </div>

      {userRating?.review && <Review userRating={userRating} />}
    </>
  );
};

const RemoveFromSeenHistoryButton: FunctionComponent<{
  mediaItem: MediaItemDetailsResponse;
}> = (props) => {
  const { mediaItem } = props;

  return (
    <div
      className="text-sm btn-red"
      onClick={() =>
        confirm(
          `Do you wont to remove all ${mediaItem.seenHistory.length} seen history entries?`
        ) && removeFromSeenHistory(mediaItem)
      }
    >
      Remove from seen history
    </div>
  );
};

const MarkAsSeenButtonWithModal: FunctionComponent<{
  mediaItem: MediaItemDetailsResponse;
}> = (props) => {
  const { mediaItem } = props;

  return (
    <>
      <Modal
        openModal={(openModal) => (
          <div className="text-sm btn-blue" onClick={openModal}>
            Add to seen history
          </div>
        )}
      >
        {(closeModal) => (
          <SelectSeenDate mediaItem={mediaItem} closeModal={closeModal} />
        )}
      </Modal>
    </>
  );
};

const IconWithLink: FunctionComponent<{
  href: string;
  src: string;
  whiteLogo?: boolean;
}> = (props) => {
  return (
    <a href={props.href} className="flex mr-2">
      <img
        src={props.src}
        className={clsx(props.whiteLogo && 'invert dark:invert-0')}
      />
    </a>
  );
};

const ExternalLinks: FunctionComponent<{
  mediaItem: MediaItemDetailsResponse;
}> = (props) => {
  const { mediaItem } = props;

  return (
    <div className="flex h-5">
      {mediaItem.imdbId && (
        <IconWithLink
          href={`https://www.imdb.com/title/${mediaItem.imdbId}`}
          src="logo/imdb.png"
        />
      )}

      {mediaItem.tmdbId && (
        <IconWithLink
          href={`https://www.themoviedb.org/${mediaItem.mediaType}/${mediaItem.tmdbId}`}
          src="logo/tmdb.svg"
        />
      )}

      {mediaItem.igdbId && (
        <IconWithLink
          href={`https://www.igdb.com/games/${mediaItem.title
            .toLowerCase()
            .replaceAll(' ', '-')}`}
          src="logo/igdb.png"
          whiteLogo={true}
        />
      )}

      {mediaItem.openlibraryId && (
        <IconWithLink
          href={`https://openlibrary.org/${mediaItem.openlibraryId}`}
          src="logo/openlibrary.svg"
        />
      )}

      {mediaItem.audibleId && (
        <IconWithLink
          href={`https://audible.com/pd/${mediaItem.audibleId}?overrideBaseCountry=true&ipRedirectOverride=true`}
          src="logo/audible.png"
        />
      )}
    </div>
  );
};

export const DetailsPage: FunctionComponent = () => {
  const { mediaItemId } = useParams();
  const { mediaItem, isLoading, error } = useDetails(Number(mediaItemId));

  if (isLoading) {
    return <>Loading</>;
  }

  if (error) {
    return <>{error}</>;
  }

  return (
    <div>
      <div className="flex flex-col mt-2 mb-4 md:flex-row">
        <div className="self-center w-64 shrink-0 md:self-start">
          <Poster
            src={mediaItem.poster}
            mediaType={mediaItem.mediaType}
            itemMediaType={mediaItem.mediaType}
          />
        </div>
        <div className="md:ml-4">
          <div className="mt-2 text-4xl font-bold md:mt-0">
            {mediaItem.title}
          </div>

          {mediaItem.releaseDate && (
            <div>
              <span className="font-bold">Release date: </span>
              <span>
                {new Date(mediaItem.releaseDate).toLocaleDateString()}
              </span>
            </div>
          )}

          {mediaItem.runtime > 0 && (
            <div>
              <span className="font-bold">Runtime: </span>
              <span>
                {formatDuration(
                  intervalToDuration({
                    start: 0,
                    end: mediaItem.runtime * 60 * 1000,
                  })
                )}
              </span>
            </div>
          )}

          {mediaItem.platform && (
            <div>
              <span className="font-bold">Platform: </span>
              <span>{mediaItem.platform}</span>
            </div>
          )}

          {mediaItem.network && (
            <div>
              <span className="font-bold">Network: </span>
              <span>{mediaItem.network}</span>
            </div>
          )}

          {mediaItem.status && (
            <div>
              <span className="font-bold">Status: </span>
              <span>{mediaItem.status}</span>
            </div>
          )}

          {mediaItem.genres && (
            <div>
              <span className="font-bold">
                {mediaItem.genres.length === 1 ? <>Genre</> : <>Genres</>}:{' '}
              </span>
              {mediaItem.genres.map((genre, index) => (
                <span key={genre}>
                  <span className="italic">{genre}</span>

                  {index < mediaItem.genres.length - 1 && (
                    <span className="mx-1 text-gray-600">|</span>
                  )}
                </span>
              ))}
            </div>
          )}

          {mediaItem.overview && (
            <div>
              <span className="font-bold">Overview: </span>
              <span>{mediaItem.overview}</span>
            </div>
          )}

          {mediaItem.language && (
            <div>
              <span className="font-bold">Language: </span>
              <span>{mediaItem.language}</span>
            </div>
          )}

          {mediaItem.authors && (
            <div>
              <span className="font-bold">
                {mediaItem.authors.length === 1 ? <>Author</> : <>Authors</>}:{' '}
              </span>
              {mediaItem.authors.join(', ')}
            </div>
          )}

          {mediaItem.narrators && (
            <div>
              <span className="font-bold">
                {mediaItem.narrators.length === 1 ? (
                  <>Narrator</>
                ) : (
                  <>Narrators</>
                )}
                :{' '}
              </span>
              {mediaItem.narrators.join(',')}
            </div>
          )}

          {isTvShow(mediaItem) && (
            <>
              <div>
                <span className="font-bold">Seasons: </span>
                {mediaItem.numberOfSeasons}
              </div>
              <a className="underline" href={`#/episodes/${mediaItem.id}`}>
                <div>
                  <span className="font-bold">Episodes: </span>
                  {mediaItem.numberOfEpisodes}
                  {mediaItem.unseenEpisodesCount > 0 && (
                    <> ({mediaItem.unseenEpisodesCount} unseen)</>
                  )}
                </div>
              </a>
            </>
          )}

          <div>
            <span className="font-bold">Source: </span>
            <span>{mediaItem.source}</span>
          </div>

          <div className="pt-3">
            <ExternalLinks mediaItem={mediaItem} />
          </div>
        </div>
      </div>

      {canBeOnWatchlist(mediaItem) && (
        <div className="pt-5 mt-3">
          {mediaItem.onWatchlist ? (
            <div
              className="text-sm btn-red"
              onClick={() => removeFromWatchlist(mediaItem)}
            >
              Remove from watchlist
            </div>
          ) : (
            <div
              className="text-sm btn-blue"
              onClick={() => addToWatchlist(mediaItem)}
            >
              Add to watchlist
            </div>
          )}
        </div>
      )}

      <div>
        {hasBeenReleased(mediaItem) && (
          <>
            <div className="mt-3">
              <MarkAsSeenButtonWithModal mediaItem={mediaItem} />
            </div>
            {hasBeenSeenAtLeastOnce(mediaItem) && (
              <div className="mt-3">
                <RemoveFromSeenHistoryButton mediaItem={mediaItem} />
              </div>
            )}
          </>
        )}
      </div>

      {mediaItem.mediaType === 'tv' && (
        <Link
          to={`/episodes/${mediaItem.id}`}
          className="mt-3 text-green-600 dark:text-green-400 btn"
        >
          Episodes page
        </Link>
      )}

      {mediaItem.upcomingEpisode && (
        <>
          <div className="mt-3 font-bold">
            Next episode
            {mediaItem.upcomingEpisode.releaseDate && (
              <>
                {' '}
                {relativeTimeTo(
                  new Date(mediaItem.upcomingEpisode.releaseDate)
                )}
              </>
            )}
            : {formatEpisodeNumber(mediaItem.upcomingEpisode)}{' '}
            {mediaItem.upcomingEpisode.title}
          </div>
        </>
      )}

      {mediaItem.firstUnwatchedEpisode && (
        <>
          <div className="inline-flex mt-3 font-bold">
            First unwatched episode:{' '}
            {formatEpisodeNumber(mediaItem.firstUnwatchedEpisode)}{' '}
            {mediaItem.firstUnwatchedEpisode.title}
            <MarkAsSeenFirstUnwatchedEpisode mediaItem={mediaItem} />
          </div>
        </>
      )}

      {mediaItem.lastSeenAt > 0 && (
        <div className="mt-3">
          Last seen at {new Date(mediaItem.lastSeenAt).toLocaleString()}
        </div>
      )}

      {mediaItem.seenHistory?.length > 0 && (
        <div className="mt-3">
          <div>Seen {mediaItem.seenHistory.length} times</div>
          <Link to={`/seen-history/${mediaItem.id}`} className="underline">
            Seen history
          </Link>
        </div>
      )}

      {/* Rating */}
      {canBeRated(mediaItem) && (
        <RatingAndReview
          userRating={mediaItem.userRating}
          mediaItem={mediaItem}
        />
      )}
    </div>
  );
};

const MarkAsSeenFirstUnwatchedEpisode: FunctionComponent<{
  mediaItem: MediaItemDetailsResponse;
}> = (props) => {
  const { mediaItem } = props;

  return (
    <Modal
      openModal={(openModal) => (
        <span
          className="ml-1 font-bold cursor-pointer select-none material-icons text-emerald-800"
          onClick={() => openModal()}
        >
          check
        </span>
      )}
    >
      {(closeModal) => (
        <SelectSeenDate
          mediaItem={mediaItem}
          episode={mediaItem.firstUnwatchedEpisode}
          closeModal={closeModal}
        />
      )}
    </Modal>
  );
};
