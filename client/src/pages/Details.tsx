import React, { FunctionComponent } from 'react';
import { Link, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { Plural, Trans } from '@lingui/macro';
import { parseISO } from 'date-fns';
import { originalAndTranslatedTitle } from 'src/mediaItem';

import {
  AudibleLang,
  MediaItemDetailsResponse,
  MediaItemItemsResponse,
  TvEpisode,
  TvSeason,
  UserRating,
} from 'mediatracker-api';
import { SelectSeenDate } from 'src/components/SelectSeenDate';
import { BadgeRating } from 'src/components/StarRating';
import {
  canMetadataBeUpdated,
  formatEpisodeNumber,
  hasBeenReleased,
  hasProgress,
  hasReleaseDate,
  isAudiobook,
  isBook,
  isMovie,
  isOnWatchlist,
  isTvShow,
  isVideoGame,
} from 'src/utils';
import {
  addToProgress,
  addToWatchlist,
  removeFromWatchlist,
  useDetails,
  useUpdateMetadata,
} from 'src/api/details';
import { FormatDuration, RelativeTime } from 'src/components/date';
import { Poster } from 'src/components/Poster';
import { Modal } from 'src/components/Modal';
import { useOtherUser } from 'src/api/user';
import { SetProgressComponent } from 'src/components/SetProgress';
import { useConfiguration } from 'src/api/configuration';
import { AddToListButtonWithModal } from 'src/components/AddToListModal';
import {
  AddToSeenHistoryButton,
  RemoveFromSeenHistoryButton,
} from 'src/components/AddAndRemoveFromSeenHistoryButton';
import { hasBeenSeenAtLeastOnce } from 'src/mediaItem';

const Review: FunctionComponent<{ userRating: UserRating }> = (props) => {
  const { userRating } = props;
  const { user, isLoading } = useOtherUser(userRating.userId);

  if (isLoading) {
    return <></>;
  }

  const date = new Date(userRating.date).toLocaleString();
  const author = user.name;

  return (
    <>
      <div className="">
        <Trans>
          Review by{' '}
          <i>
            <strong>{author}</strong>
          </i>{' '}
          at {date}
        </Trans>
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

const WhereToWatchComponent: FunctionComponent<{
  mediaItem: MediaItemItemsResponse;
}> = (props) => {
  const { mediaItem } = props;

  return (
    <div>
      <a
        className="underline"
        href={`https://www.themoviedb.org/${
          isTvShow(mediaItem) ? 'tv' : 'movie'
        }/${mediaItem.tmdbId}/watch`}
      >
        <Trans>Where to watch</Trans>
      </a>
    </div>
  );
};

const audibleLanguages: Record<AudibleLang, string> = {
  au: 'au',
  ca: 'ca',
  de: 'de',
  fr: 'fr',
  in: 'in',
  it: 'it',
  es: 'es',
  jp: 'co.jp',
  uk: 'co.uk',
  us: 'com',
};

const ExternalLinks: FunctionComponent<{
  mediaItem: MediaItemDetailsResponse;
}> = (props) => {
  const { mediaItem } = props;
  const { configuration } = useConfiguration();

  const audibleDomain =
    audibleLanguages[
      mediaItem.audibleCountryCode || configuration.audibleLang?.toLowerCase()
    ] || 'com';

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
          href={`https://openlibrary.org${mediaItem.openlibraryId}`}
          src="logo/openlibrary.svg"
        />
      )}

      {mediaItem.audibleId && (
        <IconWithLink
          href={`https://audible.${audibleDomain}/pd/${mediaItem.audibleId}?overrideBaseCountry=true&ipRedirectOverride=true`}
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
    return (
      <>
        <Trans>Loading</Trans>
      </>
    );
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
            {originalAndTranslatedTitle(mediaItem)}
          </div>

          {mediaItem.releaseDate && (
            <div>
              <span className="font-bold">
                <Trans>Release date</Trans>:{' '}
              </span>
              <span>
                {parseISO(mediaItem.releaseDate).toLocaleDateString()}
              </span>
            </div>
          )}

          {mediaItem.runtime > 0 && (
            <div>
              <span className="font-bold">
                <Trans>Runtime</Trans>:{' '}
              </span>
              <span>
                <FormatDuration milliseconds={mediaItem.runtime * 60 * 1000} />
              </span>
            </div>
          )}

          {mediaItem.totalRuntime > 0 && (
            <div>
              <span className="font-bold">
                <Trans>Total runtime</Trans>:{' '}
              </span>
              <span>
                <FormatDuration
                  milliseconds={mediaItem.totalRuntime * 60 * 1000}
                />
              </span>
            </div>
          )}

          {mediaItem.platform && (
            <div>
              <span className="font-bold">
                <Plural
                  value={mediaItem.platform.length}
                  one="Platform"
                  other="platforms"
                />
                :{' '}
              </span>
              <span>{mediaItem.platform.sort().join(', ')}</span>
            </div>
          )}

          {mediaItem.network && (
            <div>
              <span className="font-bold">
                <Trans>Network</Trans>:{' '}
              </span>
              <span>{mediaItem.network}</span>
            </div>
          )}

          {mediaItem.status && (
            <div>
              <span className="font-bold">
                <Trans>Status</Trans>:{' '}
              </span>
              <span>{mediaItem.status}</span>
            </div>
          )}

          {mediaItem.genres && (
            <div>
              <span className="font-bold">
                <Plural
                  value={mediaItem.genres.length}
                  one="Genre"
                  other="Genres"
                />
                :{' '}
              </span>
              {mediaItem.genres.sort().map((genre, index) => (
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
              <span className="font-bold">
                <Trans>Overview</Trans>:{' '}
              </span>
              <span className="whitespace-pre-wrap">{mediaItem.overview}</span>
            </div>
          )}

          {mediaItem.language && (
            <div>
              <span className="font-bold">
                <Trans>Language</Trans>:{' '}
              </span>
              <span>{mediaItem.language}</span>
            </div>
          )}

          {mediaItem.authors && (
            <div>
              <span className="font-bold">
                <Plural
                  value={mediaItem.authors.length}
                  one="Author"
                  other="Authors"
                />
                :{' '}
              </span>
              {mediaItem.authors.sort().join(', ')}
            </div>
          )}

          {mediaItem.narrators && (
            <div>
              <span className="font-bold">
                <Plural
                  value={mediaItem.narrators.length}
                  one="Narrator"
                  other="Narrators"
                />
                :{' '}
              </span>
              {mediaItem.narrators.sort().join(',')}
            </div>
          )}
          {mediaItem.numberOfPages && (
            <div>
              <span className="font-bold">
                <Trans>Number of pages</Trans>:{' '}
              </span>
              {mediaItem.numberOfPages}
            </div>
          )}

          {isTvShow(mediaItem) && (
            <>
              <div>
                <span className="font-bold">
                  <Trans>Seasons</Trans>:{' '}
                </span>
                {mediaItem.numberOfSeasons}
              </div>

              <div>
                <span className="font-bold">
                  <Trans>Episodes</Trans>:{' '}
                </span>
                {mediaItem.numberOfEpisodes}
              </div>

              {mediaItem.unseenEpisodesCount > 0 && (
                <div>
                  <span className="font-bold">
                    <Trans>Unseen episodes</Trans>:{' '}
                  </span>
                  {mediaItem.unseenEpisodesCount}
                </div>
              )}
            </>
          )}

          <div>
            <span className="font-bold">
              <Trans>Source</Trans>:{' '}
            </span>
            <span>{mediaItem.source}</span>
          </div>

          <div className="pt-3">
            <ExternalLinks mediaItem={mediaItem} />
          </div>
        </div>
      </div>

      {canMetadataBeUpdated(mediaItem) && (
        <div className="pt-3">
          <UpdateMetadataButton mediaItem={mediaItem} />
        </div>
      )}

      <div className="mt-3">
        {isOnWatchlist(mediaItem) ? (
          <RemoveFromWatchlistButton mediaItem={mediaItem} />
        ) : (
          <AddToWatchlistButton mediaItem={mediaItem} />
        )}
      </div>

      <div className="mt-3">
        <AddToListButtonWithModal mediaItemId={mediaItem.id} />
      </div>

      <div className="mt-3">
        {(hasBeenReleased(mediaItem) || !hasReleaseDate(mediaItem)) && (
          <>
            <AddToSeenHistoryButton mediaItem={mediaItem} />

            {hasBeenSeenAtLeastOnce(mediaItem) && (
              <div className="mt-3">
                <RemoveFromSeenHistoryButton mediaItem={mediaItem} />
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-3"></div>

      {mediaItem.mediaType === 'tv' && (
        <Link
          to={`/seasons/${mediaItem.id}`}
          className="mt-3 text-green-600 dark:text-green-400 btn"
        >
          <Trans>Episodes page</Trans>
        </Link>
      )}

      {(hasBeenReleased(mediaItem) || !hasReleaseDate(mediaItem)) &&
        !isTvShow(mediaItem) && (
          <>
            {!hasProgress(mediaItem) && (
              <div
                className="mt-3 text-sm btn"
                onClick={async () => {
                  addToProgress({
                    mediaItemId: mediaItem.id,
                    progress: 0,
                  });
                }}
              >
                {isMovie(mediaItem) && <Trans>I am watching it</Trans>}
                {isBook(mediaItem) && <Trans>I am reading it</Trans>}
                {isAudiobook(mediaItem) && <Trans>I am listening it</Trans>}
                {isVideoGame(mediaItem) && <Trans>I am playing it</Trans>}
              </div>
            )}

            {hasProgress(mediaItem) && (
              <>
                <div
                  className="mt-3 text-sm btn"
                  onClick={async () => {
                    addToProgress({
                      mediaItemId: mediaItem.id,
                      progress: 1,
                    });
                  }}
                >
                  {isMovie(mediaItem) && <Trans>I finished watching it</Trans>}
                  {isBook(mediaItem) && <Trans>I finished reading it</Trans>}
                  {isAudiobook(mediaItem) && (
                    <Trans>I finished listening it</Trans>
                  )}
                  {isVideoGame(mediaItem) && (
                    <Trans>I finished playing it</Trans>
                  )}
                </div>

                <div className="mt-3">
                  <Trans>Progress</Trans>:{' '}
                  {Math.round(mediaItem.progress * 100)}%
                </div>
              </>
            )}

            <div className="mt-3">
              <SetProgressButton mediaItem={mediaItem} />
            </div>
          </>
        )}

      {mediaItem.upcomingEpisode && (
        <>
          <div className="mt-3 font-bold">
            <Trans>Next episode</Trans>{' '}
            {mediaItem.upcomingEpisode.releaseDate && (
              <RelativeTime
                to={parseISO(mediaItem.upcomingEpisode.releaseDate)}
              />
            )}
            : {formatEpisodeNumber(mediaItem.upcomingEpisode)}{' '}
            {mediaItem.upcomingEpisode.title}
          </div>
        </>
      )}
      {mediaItem.firstUnwatchedEpisode && (
        <div className="flex mt-3 font-bold">
          <Trans>First unwatched episode</Trans>:{' '}
          {formatEpisodeNumber(mediaItem.firstUnwatchedEpisode)}{' '}
          {mediaItem.firstUnwatchedEpisode.title}
          <MarkAsSeenFirstUnwatchedEpisode mediaItem={mediaItem} />
        </div>
      )}
      {mediaItem.lastSeenAt > 0 && (
        <div className="mt-3">
          {isAudiobook(mediaItem) && (
            <Trans>
              Last listened at {new Date(mediaItem.lastSeenAt).toLocaleString()}
            </Trans>
          )}

          {isBook(mediaItem) && (
            <Trans>
              Last read at {new Date(mediaItem.lastSeenAt).toLocaleString()}
            </Trans>
          )}

          {(isMovie(mediaItem) || isTvShow(mediaItem)) && (
            <Trans>
              Last seen at {new Date(mediaItem.lastSeenAt).toLocaleString()}
            </Trans>
          )}

          {isVideoGame(mediaItem) && (
            <Trans>
              Last played at {new Date(mediaItem.lastSeenAt).toLocaleString()}
            </Trans>
          )}
        </div>
      )}
      {mediaItem.seenHistory?.length > 0 && (
        <div className="mt-3">
          <div>
            {isAudiobook(mediaItem) && (
              <Plural
                value={mediaItem.seenHistory.length}
                one="Listened 1 time"
                other="Listened # times"
              />
            )}

            {isBook(mediaItem) && (
              <Plural
                value={mediaItem.seenHistory.length}
                one="Read 1 time"
                other="Read # times"
              />
            )}

            {(isMovie(mediaItem) || isTvShow(mediaItem)) && (
              <Plural
                value={mediaItem.seenHistory.length}
                one="Seen 1 time"
                other="Seen # times"
              />
            )}

            {isVideoGame(mediaItem) && (
              <Plural
                value={mediaItem.seenHistory.length}
                one="Played 1 time"
                other="Played # times"
              />
            )}
          </div>
          <Link to={`/seen-history/${mediaItem.id}`} className="underline">
            {isAudiobook(mediaItem) && <Trans>Listened history</Trans>}

            {isBook(mediaItem) && <Trans>Read history</Trans>}

            {(isMovie(mediaItem) || isTvShow(mediaItem)) && (
              <Trans>Seen history</Trans>
            )}

            {isVideoGame(mediaItem) && <Trans>Played history</Trans>}
          </Link>
        </div>
      )}

      {(isMovie(mediaItem) || isTvShow(mediaItem)) && (
        <div className="pt-3">
          <WhereToWatchComponent mediaItem={mediaItem} />
        </div>
      )}

      {/* Rating */}
      {(hasBeenReleased(mediaItem) || !hasReleaseDate(mediaItem)) && (
        <RatingAndReview
          userRating={mediaItem.userRating}
          mediaItem={mediaItem}
        />
      )}
    </div>
  );
};

export const AddToWatchlistButton: FunctionComponent<{
  mediaItem: MediaItemItemsResponse;
  season?: TvSeason;
  episode?: TvEpisode;
}> = (props) => {
  const { mediaItem, season, episode } = props;

  return (
    <div
      className="text-sm btn-blue "
      onClick={() =>
        addToWatchlist({
          mediaItem,
          season,
          episode,
        })
      }
    >
      <Trans>Add to watchlist</Trans>
    </div>
  );
};

export const RemoveFromWatchlistButton: FunctionComponent<{
  mediaItem: MediaItemItemsResponse;
  season?: TvSeason;
  episode?: TvEpisode;
}> = (props) => {
  const { mediaItem, season, episode } = props;

  return (
    <div
      className="text-sm btn-red"
      onClick={() =>
        removeFromWatchlist({
          mediaItem,
          season,
          episode,
        })
      }
    >
      <Trans>Remove from watchlist</Trans>
    </div>
  );
};

const UpdateMetadataButton: FunctionComponent<{
  mediaItem: MediaItemItemsResponse;
}> = (props) => {
  const { mediaItem } = props;

  const { updateMetadata, isLoading, isError } = useUpdateMetadata(
    mediaItem.id
  );

  return (
    <button
      className="text-sm btn"
      onClick={() => updateMetadata()}
      disabled={isLoading}
    >
      <Trans>Update metadata</Trans>
    </button>
  );
};

const SetProgressButton: FunctionComponent<{
  mediaItem: MediaItemDetailsResponse;
}> = (props) => {
  const { mediaItem } = props;

  return (
    <Modal
      openModal={(openModal) => (
        <div className="text-sm text-green-500 btn" onClick={() => openModal()}>
          <Trans>Set progress</Trans>
        </div>
      )}
    >
      {(closeModal) => (
        <SetProgressComponent mediaItem={mediaItem} closeModal={closeModal} />
      )}
    </Modal>
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
