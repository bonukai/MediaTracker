import { isSameDay, parseISO } from 'date-fns';
import { minBy } from 'lodash';
import { FC, Fragment } from 'react';
import { Link } from 'react-router-dom';

import { Plural, Trans } from '@lingui/macro';

import { Button } from './Button';
import { RelativeTime } from './Date';
import {
  AddEpisodeOrMediaItemToSeenHistoryAction,
  AddToWatchlistAction,
  RemoveFromWatchlistAction,
} from './MediaItemActionButtons';
import { MediaTypeIcon, MediaTypePill } from './MediaTypeIcon';
import { Poster } from './Poster';
import { StarRatingComponent } from './StarRatingComponent';
import { MediaTypeTranslation } from './Translations';
import {
  formatEpisodeNumber,
  hasFirstUnwatchedEpisode,
  hasLastAiredEpisode,
  hasReleaseDate,
  hasUnseenEpisodes,
  hasUpcomingEpisode,
  isTvShow,
  posterAspectRatio,
  releaseYear,
} from '../mediaItemHelpers';
import { cx } from '../utils';

import type { MediaItemResponse } from '@server/entity/mediaItemModel';
import { Accent } from './Accent';
export type MediaItemPresentationSettings = {
  showRating?: boolean;
  showLastAiring?: boolean;
  showNextAiring?: boolean;
  showAddToSeenHistoryButton?: boolean;
  showAddFirstUnwatchedEpisodeToSeenHistoryButton?: boolean;
  showAddOrRemoveFromWatchlistButton?: boolean;
  showNumberOfUnseenEpisodes?: boolean;
};

const MovieReleaseType: FC<{ mediaItem: MediaItemResponse }> = (props) => {
  const { mediaItem } = props;

  if (mediaItem.mediaType !== 'movie' || !mediaItem.releaseDate) {
    return <Trans>release</Trans>;
  }

  const releaseDates = [
    {
      type: <Trans>theatrical release</Trans>,
      date: mediaItem.theatricalReleaseDate,
    },
    {
      type: <Trans>Tv release</Trans>,
      date: mediaItem.tvReleaseDate,
    },
    {
      type: <Trans>digital release</Trans>,
      date: mediaItem.digitalReleaseDate,
    },
    {
      type: <Trans>physical release</Trans>,
      date: mediaItem.physicalReleaseDate,
    },
  ].filter((item) => item.date);

  const firstReleaseDate = minBy(releaseDates, (item) => item.date);

  if (
    firstReleaseDate &&
    firstReleaseDate.date &&
    releaseDates.filter((item) => item.date === firstReleaseDate.date)
      .length === 1 &&
    isSameDay(parseISO(mediaItem.releaseDate), parseISO(firstReleaseDate.date))
  ) {
    return firstReleaseDate.type;
  }

  return <Trans>release in</Trans>;
};

const MediaItemNextAiringText: FC<{ mediaItem: MediaItemResponse }> = (
  props
) => {
  const { mediaItem } = props;

  return (
    <>
      {isTvShow(mediaItem) && hasUpcomingEpisode(mediaItem) && (
        <div className="text-[14px] text-slate-500 flex items-center whitespace-pre overflow-ellipsis overflow-clip">
          <Trans>
            <Accent>{formatEpisodeNumber(mediaItem.upcomingEpisode)}</Accent>
            <span> </span>
            <span className="font-semibold">
              <RelativeTime
                to={parseISO(mediaItem.upcomingEpisode.releaseDate)}
              />
            </span>
          </Trans>
        </div>
      )}
      {!isTvShow(mediaItem) && hasReleaseDate(mediaItem) && (
        <div className="text-[14px] text-slate-500 flex items-center whitespace-pre overflow-ellipsis overflow-clip">
          <Trans>
            <MovieReleaseType mediaItem={mediaItem} />{' '}
            <span className="font-semibold">
              <RelativeTime to={parseISO(mediaItem.releaseDate)} />
            </span>
          </Trans>
        </div>
      )}
    </>
  );
};

const MediaItemLastAiringText: FC<{ mediaItem: MediaItemResponse }> = (
  props
) => {
  const { mediaItem } = props;

  return (
    <>
      {hasLastAiredEpisode(mediaItem) && (
        <div className="text-[14px] text-slate-500 overflow-ellipsis overflow-clip">
          <Trans>
            <Accent>{formatEpisodeNumber(mediaItem.lastAiredEpisode)}</Accent>{' '}
            released{' '}
            <span className="font-semibold">
              <RelativeTime
                to={parseISO(mediaItem.lastAiredEpisode.releaseDate)}
              />
            </span>
          </Trans>
        </div>
      )}

      {!isTvShow(mediaItem) && hasReleaseDate(mediaItem) && (
        <div className="text-[14px] text-slate-500 overflow-ellipsis overflow-clip ">
          <Trans>
            released{' '}
            <span className="font-semibold">
              <RelativeTime to={parseISO(mediaItem.releaseDate)} />
            </span>
          </Trans>
        </div>
      )}
    </>
  );
};

const MediaItemNumberOfUnwatchedEpisodesText: FC<{
  mediaItem: MediaItemResponse;
}> = (props) => {
  const { mediaItem } = props;

  return (
    <>
      {hasUnseenEpisodes(mediaItem) && (
        <div className="text-[14px] text-slate-500 ">
          <Plural
            value={mediaItem.unseenEpisodesCount}
            one={
              <Trans>
                <Accent>1</Accent> episode to watch
              </Trans>
            }
            other={
              <Trans>
                <Accent>#</Accent> episodes to watch
              </Trans>
            }
          />
        </div>
      )}
    </>
  );
};

export const AddMediaItemToSeenHistoryButton: FC<{
  mediaItem: MediaItemResponse;
}> = (props) => {
  const { mediaItem } = props;

  return (
    <>
      <AddEpisodeOrMediaItemToSeenHistoryAction mediaItem={mediaItem}>
        <Button className="w-full" multiline>
          <Trans>Add to seen history</Trans>
        </Button>
      </AddEpisodeOrMediaItemToSeenHistoryAction>
    </>
  );
};

export const AddFirstUnwatchedEpisodeToSeenHistoryButton: FC<{
  mediaItem: MediaItemResponse;
}> = (props) => {
  const { mediaItem } = props;

  return (
    <>
      {hasFirstUnwatchedEpisode(mediaItem) && (
        <AddEpisodeOrMediaItemToSeenHistoryAction
          mediaItem={mediaItem}
          episode={mediaItem.firstUnwatchedEpisode}
        >
          <Button className="w-full">
            <Trans>
              Add{' '}
              <Accent>
                {formatEpisodeNumber(mediaItem.firstUnwatchedEpisode)}
              </Accent>{' '}
              to seen history
            </Trans>
          </Button>
        </AddEpisodeOrMediaItemToSeenHistoryAction>
      )}
    </>
  );
};

const AddFirstUnwatchedEpisodeOrNonTvShowToSeenHistoryButton: FC<{
  mediaItem: MediaItemResponse;
}> = (props) => {
  const { mediaItem } = props;

  return (
    <>
      {hasFirstUnwatchedEpisode(mediaItem) && (
        <AddFirstUnwatchedEpisodeToSeenHistoryButton mediaItem={mediaItem} />
      )}
      {!isTvShow(mediaItem) && (
        <AddMediaItemToSeenHistoryButton mediaItem={mediaItem} />
      )}
    </>
  );
};

export const WatchlistButton: FC<{
  mediaItem: MediaItemResponse;
}> = (props) => {
  const { mediaItem } = props;

  return (
    <>
      {mediaItem.onWatchlist ? (
        <RemoveFromWatchlistAction mediaItem={mediaItem}>
          <Button color="red" className="w-full">
            <Trans>Remove from watchlist</Trans>
          </Button>
        </RemoveFromWatchlistAction>
      ) : (
        <AddToWatchlistAction mediaItem={mediaItem}>
          <Button className="w-full">
            <Trans>Add to watchlist</Trans>
          </Button>
        </AddToWatchlistAction>
      )}
    </>
  );
};

export const MediaItemViewList: FC<{
  mediaItem: MediaItemResponse;
  settings?: MediaItemPresentationSettings;
}> = (props) => {
  const { mediaItem, settings } = props;

  return (
    <Fragment>
      <div className="border-[#EEEEEE] rounded-lg border-[1px] p-1 grid grid-cols-[subgrid] col-span-full items-center justify-center align-middle overflow-clip overflow-ellipsis hover:bg-slate-100 transition-all duration-75 md:h-12">
        <div className="flex items-center w-[26px] h-full ">
          <Link to={`/details/${mediaItem.id}`} className="w-full">
            <Poster mediaItem={mediaItem} roundedCorners="all" width={52} />
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-[16px] font-semibold whitespace-nowrap overflow-ellipsis overflow-clip mr-3 ">
            <a href={`/details/${mediaItem.id}`}>{mediaItem.title}</a>{' '}
            {hasReleaseDate(mediaItem) && (
              <span className="font-normal">{releaseYear(mediaItem)}</span>
            )}
          </div>
          <MediaTypeIcon mediaItem={mediaItem} />
        </div>

        {settings?.showNextAiring && (
          <div>
            <MediaItemNextAiringText mediaItem={mediaItem} />
          </div>
        )}

        {settings?.showLastAiring && (
          <div>
            <MediaItemLastAiringText mediaItem={mediaItem} />
          </div>
        )}

        {settings?.showNumberOfUnseenEpisodes && (
          <div>
            <MediaItemNumberOfUnwatchedEpisodesText mediaItem={mediaItem} />
          </div>
        )}

        {settings?.showRating && (
          <div>
            <StarRatingComponent mediaItem={mediaItem} />
          </div>
        )}

        {settings?.showAddFirstUnwatchedEpisodeToSeenHistoryButton && (
          <div>
            <AddFirstUnwatchedEpisodeOrNonTvShowToSeenHistoryButton
              mediaItem={mediaItem}
            />
          </div>
        )}

        {settings?.showAddOrRemoveFromWatchlistButton && (
          <div>
            <WatchlistButton mediaItem={mediaItem} />
          </div>
        )}
      </div>
    </Fragment>
  );
};

export const MediaItemViewCard: FC<{
  mediaItem: MediaItemResponse;
  settings?: MediaItemPresentationSettings;
}> = (props) => {
  const { mediaItem, settings } = props;

  return (
    <div className="border-[#EEEEEE] rounded-lg border-[1px] w-[500px] h-[260px] flex ">
      <div
        className={cx(
          'h-full rounded-l-lg border-t-[1px] border-r-[1px] border-l-[1px] ',
          posterAspectRatio(mediaItem)
        )}
      >
        <Link to={`/details/${mediaItem.id}`} className="w-full">
          <Poster mediaItem={mediaItem} roundedCorners="left" width={500} />
        </Link>
      </div>

      <div className="flex flex-col w-full h-full gap-1 p-2 rounded-r overflow-clip">
        <div className="text-[20px] font-bold whitespace-nowrap overflow-ellipsis overflow-clip mb-1">
          <Link to={`/details/${mediaItem.id}`}>{mediaItem.title}</Link>
        </div>

        <div className="text-[18px] font-semibold flex flex-row items-center justify-start mb-1 align-middle">
          {hasReleaseDate(mediaItem) && (
            <>
              <div>{releaseYear(mediaItem)}</div>
              <div className="inline mx-1.5 font-bold">•</div>
            </>
          )}

          <MediaTypePill mediaItem={mediaItem} />
        </div>

        {settings?.showRating && <StarRatingComponent mediaItem={mediaItem} />}

        {settings?.showNextAiring && (
          <MediaItemNextAiringText mediaItem={mediaItem} />
        )}
        {settings?.showLastAiring && (
          <MediaItemLastAiringText mediaItem={mediaItem} />
        )}

        <MediaItemNumberOfUnwatchedEpisodesText mediaItem={mediaItem} />

        <div className="flex flex-col justify-end gap-2 grow">
          {settings?.showAddFirstUnwatchedEpisodeToSeenHistoryButton && (
            <AddFirstUnwatchedEpisodeOrNonTvShowToSeenHistoryButton
              mediaItem={mediaItem}
            />
          )}

          {settings?.showAddOrRemoveFromWatchlistButton && (
            <div>
              <WatchlistButton mediaItem={mediaItem} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const MediaItemViewPoster: FC<{
  mediaItem: MediaItemResponse;
  settings?: MediaItemPresentationSettings;
}> = (props) => {
  const { mediaItem, settings } = props;

  return (
    <div className="w-[240px]">
      <div className="md:aspect-[2/3] flex items-end relative">
        <Link to={`/details/${mediaItem.id}`} className="w-full">
          <Poster
            mediaItem={mediaItem}
            roundedCorners="all"
            width={240 * 1.5}
          />
        </Link>

        {isTvShow(mediaItem) && (
          <div className="absolute z-10 flex gap-2 right-1 top-1">
            {hasFirstUnwatchedEpisode(mediaItem) && (
              <div className="py-0.5 px-1 rounded font-semibold bg-pink-100 text-pink-800 select-none">
                {formatEpisodeNumber(mediaItem.firstUnwatchedEpisode)}
              </div>
            )}

            {hasUnseenEpisodes(mediaItem) && (
              <div className="py-0.5 px-1 rounded font-semibold bg-pink-100 text-pink-800 select-none">
                {mediaItem.unseenEpisodesCount}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 pt-2">
        <div className="flex justify-between text-[12px] text-slate-500">
          <div>
            {hasReleaseDate(mediaItem) && <> {releaseYear(mediaItem)}</>}
          </div>
          <div>
            <MediaTypeTranslation mediaType={mediaItem.mediaType} />
          </div>
        </div>

        <div className="text-[16px] font-semibold whitespace-nowrap overflow-ellipsis overflow-clip tracking-wide">
          <Link to={`/details/${mediaItem.id}`}>{mediaItem.title}</Link>
        </div>

        {settings?.showRating && <StarRatingComponent mediaItem={mediaItem} />}

        {settings?.showNextAiring && (
          <MediaItemNextAiringText mediaItem={mediaItem} />
        )}
        {settings?.showLastAiring && (
          <MediaItemLastAiringText mediaItem={mediaItem} />
        )}

        <div>
          {settings?.showNumberOfUnseenEpisodes && (
            <MediaItemNumberOfUnwatchedEpisodesText mediaItem={mediaItem} />
          )}
        </div>

        {settings?.showAddFirstUnwatchedEpisodeToSeenHistoryButton && (
          <>
            <div className="mt-1" />
            <AddFirstUnwatchedEpisodeOrNonTvShowToSeenHistoryButton
              mediaItem={mediaItem}
            />
          </>
        )}

        {settings?.showAddOrRemoveFromWatchlistButton && (
          <div className="mt-1">
            <WatchlistButton mediaItem={mediaItem} />
          </div>
        )}
      </div>
    </div>
  );
};

export const MediaItemViewPosterMinimal: FC<{
  mediaItem: MediaItemResponse;
  settings?: MediaItemPresentationSettings;
}> = (props) => {
  const { mediaItem } = props;

  return (
    <div className="w-[200px]">
      <div className="md:aspect-[2/3] flex items-end ">
        <Link to={`/details/${mediaItem.id}`} className="w-full">
          <Poster
            mediaItem={mediaItem}
            roundedCorners="all"
            width={200 * 1.5}
          />
        </Link>
      </div>
      <div className="flex flex-col pt-2 ">
        <div className="flex justify-between text-[12px] text-slate-500">
          <div>
            {hasReleaseDate(mediaItem) && <> {releaseYear(mediaItem)}</>}
          </div>
          <div>
            <MediaTypeTranslation mediaType={mediaItem.mediaType} />
          </div>
        </div>
        <div className="text-[16px] font-semibold whitespace-nowrap overflow-ellipsis overflow-clip tracking-wide">
          <Link to={`/details/${mediaItem.id}`}>{mediaItem.title}</Link>
        </div>
      </div>
    </div>
  );
};
