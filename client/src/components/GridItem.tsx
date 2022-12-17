import React, { FunctionComponent } from 'react';
import styled from 'styled-components';
import { t, Trans } from '@lingui/macro';
import { parseISO } from 'date-fns';

import { removeFromWatchlist } from 'src/api/details';
import { BadgeRating } from 'src/components/StarRating';
import { originalAndTranslatedTitle } from 'src/mediaItem';

import {
  formatEpisodeNumber,
  formatSeasonNumber,
  hasBeenReleased,
  hasProgress,
  isTvShow,
} from 'src/utils';
import { FormatDuration, RelativeTime } from 'src/components/date';
import {
  MediaItemItemsResponse,
  MediaType,
  TvEpisode,
  TvSeason,
} from 'mediatracker-api';
import { Poster } from 'src/components/Poster';
import { AddToSeenHistoryButton } from 'src/components/AddAndRemoveFromSeenHistoryButton';
import { AddToWatchlistButton } from 'src/pages/Details';
import { Confirm } from 'src/components/Confirm';

export type GridItemAppearanceArgs = {
  showNextAiring?: boolean;
  showLastAiring?: boolean;
  showFirstUnwatchedEpisode?: boolean;
  showRating?: boolean;
  showAddToWatchlistAndMarkAsSeenButtons?: boolean;
  showMarksAsSeenFirstUnwatchedEpisode?: boolean;
  showMarksAsSeenLastAiredEpisode?: boolean;
  showTotalRuntime?: boolean;
  showReleaseDate?: boolean;
  showLastSeenAt?: boolean;
  topBar?: {
    showOnWatchlistIcon?: boolean;
    showUnwatchedEpisodesCount?: boolean;
    showFirstUnwatchedEpisodeBadge?: boolean;
  };
};

export const GridItem: FunctionComponent<{
  mediaItem: MediaItemItemsResponse;
  season?: TvSeason;
  episode?: TvEpisode;
  mediaType?: MediaType;
  removeFromListButton?: {
    listId: number;
    listTitle: string;
  };
  appearance?: GridItemAppearanceArgs;
}> = (props) => {
  const { mediaItem, season, episode, mediaType } = props;
  const {
    topBar,
    showNextAiring,
    showLastAiring,
    showMarksAsSeenFirstUnwatchedEpisode,
    showMarksAsSeenLastAiredEpisode,
    showRating,
    showAddToWatchlistAndMarkAsSeenButtons,
    showTotalRuntime,
    showReleaseDate,
    showLastSeenAt,
  } = props.appearance || {};

  const item = episode || season || mediaItem;

  const isOnWatchlist =
    (season && season.onWatchlist) ||
    (episode && episode.onWatchlist) ||
    (!episode && !season && mediaItem.onWatchlist);

  const mediaTypeString: Record<MediaType, string> = {
    audiobook: t`Audiobook`,
    book: t`Book`,
    movie: t`Movie`,
    tv: t`Tv`,
    video_game: t`Video game`,
  };

  if (season && episode) {
    throw new Error('Booth season and episode cannot be provided');
  }

  if (season && season.tvShowId !== mediaItem.id) {
    throw new Error('Season needs to be from the same tv show as mediaItem');
  }

  if (episode && episode.tvShowId !== mediaItem.id) {
    throw new Error('Episode needs to be from the same tv show as mediaItem');
  }

  return (
    <div className="item">
      <div className="pb-4">
        <Poster
          src={mediaItem.posterSmall}
          mediaType={mediaType}
          itemMediaType={mediaItem.mediaType}
          href={
            season
              ? `#/seasons/${mediaItem.id}/${season.seasonNumber}`
              : episode
              ? `#/episode/${mediaItem.id}/${episode.seasonNumber}/${episode.episodeNumber}`
              : `#/details/${mediaItem.id}`
          }
        >
          {topBar && (
            <>
              {topBar.showOnWatchlistIcon && (
                <div className="absolute top-0 left-0 inline-flex mt-1 pointer-events-auto hover:cursor-pointer">
                  {isOnWatchlist && (
                    <Item
                      onClick={async (e) => {
                        e.preventDefault();

                        if (
                          await Confirm(
                            t`Remove "${originalAndTranslatedTitle(mediaItem)}${
                              season
                                ? ' ' + formatSeasonNumber(season)
                                : episode
                                ? ' ' + formatEpisodeNumber(episode)
                                : ''
                            }" from watchlist?`
                          )
                        ) {
                          removeFromWatchlist({ mediaItem, season, episode });
                        }
                      }}
                    >
                      <span className="flex material-icons">bookmark</span>
                    </Item>
                  )}
                </div>
              )}

              {isTvShow(mediaItem) ? (
                <a
                  className="absolute inline-flex pointer-events-auto foo right-1 top-1 hover:no-underline"
                  href={`#/seasons/${mediaItem.id}`}
                >
                  {topBar.showFirstUnwatchedEpisodeBadge &&
                    mediaItem.firstUnwatchedEpisode && (
                      <Item>
                        {formatEpisodeNumber(mediaItem.firstUnwatchedEpisode)}
                      </Item>
                    )}
                  {topBar.showUnwatchedEpisodesCount &&
                    mediaItem.unseenEpisodesCount > 0 && (
                      <Item>{mediaItem.unseenEpisodesCount}</Item>
                    )}
                  {topBar.showUnwatchedEpisodesCount && mediaItem.seen == true && (
                    <Item>
                      <i className="flex text-white material-icons hover:text-yellow-600">
                        check_circle_outline
                      </i>
                    </Item>
                  )}
                </a>
              ) : (
                <>
                  {topBar.showUnwatchedEpisodesCount && mediaItem.seen == true && (
                    <div className="absolute inline-flex pointer-events-auto foo right-1 top-1">
                      <Item>
                        <i className="flex text-white select-none material-icons">
                          check_circle_outline
                        </i>
                      </Item>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {showRating && hasBeenReleased(mediaItem) && (
            <div className="absolute pointer-events-auto bottom-1 left-1">
              <BadgeRating
                mediaItem={mediaItem}
                season={season}
                episode={episode}
              />
            </div>
          )}
        </Poster>

        <div className="mt-1 overflow-hidden whitespace-nowrap text-ellipsis">
          {/* Release year and MediaType */}
          <div className="flex justify-between text-gray-500 dark:text-gray-400">
            <span>
              {mediaItem.releaseDate &&
                parseISO(mediaItem.releaseDate).getFullYear()}
            </span>

            <span>{mediaTypeString[mediaItem.mediaType]}</span>
          </div>

          {/* Title */}
          <div className="overflow-hidden text-lg overflow-ellipsis whitespace-nowrap">
            {season && formatSeasonNumber(season) + ' '}
            {episode && formatEpisodeNumber(episode) + ' '}
            {originalAndTranslatedTitle(mediaItem)}
          </div>

          {hasProgress(mediaItem) && (
            <>
              <div className="w-full h-2 mt-1 rounded bg-slate-300">
                <div
                  className="h-full rounded bg-slate-900"
                  style={{ width: `${mediaItem.progress * 100}%` }}
                />
              </div>
            </>
          )}

          {showNextAiring && (
            <div className='overflow-hidden overflow-ellipsis whitespace-nowrap"'>
              {mediaItem.mediaType === 'tv' && mediaItem.upcomingEpisode && (
                <>
                  {formatEpisodeNumber(mediaItem.upcomingEpisode)}{' '}
                  <RelativeTime
                    to={parseISO(mediaItem.upcomingEpisode.releaseDate)}
                  />
                </>
              )}
              {mediaItem.mediaType !== 'tv' && mediaItem.releaseDate && (
                <Trans>
                  Release <RelativeTime to={parseISO(mediaItem.releaseDate)} />
                </Trans>
              )}
            </div>
          )}

          {showLastAiring && (
            <div className="overflow-hidden overflow-ellipsis whitespace-nowrap">
              {mediaItem.mediaType === 'tv' && mediaItem.lastAiredEpisode && (
                <>
                  {formatEpisodeNumber(mediaItem.lastAiredEpisode)}{' '}
                  <RelativeTime
                    to={parseISO(mediaItem.lastAiredEpisode.releaseDate)}
                  />
                </>
              )}
              {mediaItem.mediaType !== 'tv' && mediaItem.releaseDate && (
                <Trans>
                  Released <RelativeTime to={parseISO(mediaItem.releaseDate)} />
                </Trans>
              )}
            </div>
          )}

          {showTotalRuntime && (
            <>
              <FormatDuration
                milliseconds={
                  (episode
                    ? episode.runtime || mediaItem.runtime
                    : season
                    ? season.totalRuntime
                    : mediaItem.totalRuntime) *
                  60 *
                  1000
                }
              />
            </>
          )}

          {showReleaseDate && item.releaseDate && (
            <>{new Date(item.releaseDate).toLocaleDateString()}</>
          )}

          {showLastSeenAt && item.lastSeenAt && (
            <>{new Date(item.lastSeenAt).toLocaleString()}</>
          )}
        </div>

        {showMarksAsSeenFirstUnwatchedEpisode &&
          (!isTvShow(mediaItem) ||
            (isTvShow(mediaItem) && mediaItem.firstUnwatchedEpisode)) && (
            <div className="flex flex-col items-center mt-2">
              <AddToSeenHistoryButton
                mediaItem={mediaItem}
                episode={mediaItem.firstUnwatchedEpisode}
                useSeasonAndEpisodeNumber={true}
              />
            </div>
          )}

        {showMarksAsSeenLastAiredEpisode &&
          (!isTvShow(mediaItem) ||
            (isTvShow(mediaItem) && mediaItem.lastAiredEpisode)) && (
            <div className="flex flex-col items-center mt-2">
              <AddToSeenHistoryButton
                mediaItem={mediaItem}
                episode={mediaItem.lastAiredEpisode}
                useSeasonAndEpisodeNumber={true}
              />
            </div>
          )}

        {showAddToWatchlistAndMarkAsSeenButtons && (
          <>
            {!isOnWatchlist && (
              <div className="flex flex-col items-center ">
                <>
                  <div className="mt-2" />
                  <AddToWatchlistButton
                    mediaItem={mediaItem}
                    season={season}
                    episode={episode}
                  />
                </>

                {hasBeenReleased(mediaItem) && (
                  <>
                    <div className="mt-2" />
                    <AddToSeenHistoryButton
                      mediaItem={mediaItem}
                      season={season}
                      episode={episode}
                    />
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const Item = styled.div.attrs({
  className:
    'rounded bg-red-900 px-1 text-lg ml-1 text-white hover:text-yellow-600 shadow-sm shadow-black',
})``;
