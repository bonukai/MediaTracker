import React, { FunctionComponent } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { addToWatchlist, removeFromWatchlist } from 'src/api/details';
import { BadgeRating } from 'src/components/StarRating';

import {
  canBeMarkedAsSeen,
  canBeOnWatchlist,
  canBeRated,
  formatEpisodeNumber,
  isTvShow,
} from '../utils';
import { relativeTimeTo } from 'src/date';
import { MediaItemItemsResponse, MediaType } from 'mediatracker-api';
import { Poster } from 'src/components/Poster';
import { SelectSeenDate } from 'src/components/SelectSeenDate';
import { Modal } from 'src/components/Modal';

export type GridItemAppearanceArgs = {
  showNextAiring?: boolean;
  showFirstUnwatchedEpisode?: boolean;
  showRating?: boolean;
  showAddToWatchlistAndMarkAsSeenButtons?: boolean;

  topBar?: {
    showOnWatchlistIcon?: boolean;
    showUnwatchedEpisodesCount?: boolean;
    showFirstUnwatchedEpisodeBadge?: boolean;
  };
};

export const GridItem: FunctionComponent<{
  mediaItem: MediaItemItemsResponse;
  mediaType?: MediaType;
  appearance?: GridItemAppearanceArgs;
}> = (props) => {
  const { mediaItem, mediaType } = props;
  const {
    topBar,
    showNextAiring,
    showFirstUnwatchedEpisode,
    showRating,
    showAddToWatchlistAndMarkAsSeenButtons,
  } = props.appearance || {};
  const { t } = useTranslation();

  const mediaTypeString: Record<MediaType, string> = {
    audiobook: t('Audiobook'),
    book: t('Book'),
    movie: t('Movie'),
    tv: t('Tv'),
    video_game: t('Video game'),
  };

  return (
    <div key={mediaItem.id} className="item">
      <div className="pb-4">
        <Poster
          src={mediaItem.posterSmall}
          mediaType={mediaType}
          itemMediaType={mediaItem.mediaType}
          href={`#/details/${mediaItem.id}`}
        >
          {topBar && (
            <>
              {topBar.showOnWatchlistIcon && (
                <div className="absolute top-0 left-0 inline-flex mt-1 pointer-events-auto hover:cursor-pointer">
                  {mediaItem.onWatchlist && (
                    <Item
                      onClick={(e) => {
                        e.preventDefault();

                        if (
                          confirm(
                            t('Remove "{{ title }}" from watchlist?', {
                              title: mediaItem.title,
                            })
                          )
                        ) {
                          removeFromWatchlist(mediaItem);
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
                  href={`#/episodes/${mediaItem.id}`}
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

          {showRating && canBeRated(mediaItem) && (
            <div className="absolute pointer-events-auto bottom-1 left-1">
              <BadgeRating mediaItem={mediaItem} />
            </div>
          )}
        </Poster>

        <div className="mt-1 overflow-hidden whitespace-nowrap text-ellipsis">
          {/* Release year and MediaType */}
          <div className="flex justify-between text-gray-500 dark:text-gray-400">
            <span>
              {mediaItem.releaseDate &&
                new Date(mediaItem.releaseDate).getFullYear()}
            </span>

            <span>{mediaTypeString[mediaItem.mediaType]}</span>
          </div>

          {/* Title */}
          <div className="overflow-hidden text-lg overflow-ellipsis whitespace-nowrap">
            {mediaItem.title}
          </div>

          {showNextAiring && (
            <>
              {mediaItem.mediaType === 'tv' && mediaItem.upcomingEpisode && (
                <>
                  <div>
                    {formatEpisodeNumber(mediaItem.upcomingEpisode)}{' '}
                    {relativeTimeTo(
                      new Date(mediaItem.upcomingEpisode.releaseDate)
                    )}
                  </div>
                </>
              )}
              {mediaItem.mediaType !== 'tv' && mediaItem.releaseDate && (
                <>
                  {t('Release {{ relativeTime }}', {
                    relativeTime: relativeTimeTo(
                      new Date(mediaItem.releaseDate)
                    ),
                  })}
                </>
              )}
            </>
          )}
        </div>

        {showAddToWatchlistAndMarkAsSeenButtons && (
          <>
            {!mediaItem.onWatchlist && (
              <div className="flex flex-col">
                {canBeOnWatchlist(mediaItem) && (
                  <div
                    className="my-1 text-sm text-center pointer-events-auto btn dark:bg-gray-900 bg-zinc-100"
                    onClick={(e) => {
                      e.preventDefault();
                      addToWatchlist(mediaItem);
                    }}
                  >
                    {t('Add to watchlist')}
                  </div>
                )}
                {canBeMarkedAsSeen(mediaItem) && (
                  <Modal
                    openModal={(openModal) => (
                      <>
                        <div
                          className="my-1 text-sm text-center pointer-events-auto dark:bg-gray-900 bg-zinc-100 btn"
                          onClick={() => openModal()}
                        >
                          {t('Mark as seen')}
                        </div>
                      </>
                    )}
                  >
                    {(closeModal) => (
                      <SelectSeenDate
                        mediaItem={mediaItem}
                        closeModal={closeModal}
                      />
                    )}
                  </Modal>
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
