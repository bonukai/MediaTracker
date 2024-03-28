import type {
  MediaItemResponse,
  SeasonResponse,
  EpisodeResponse,
} from '@server/entity/mediaItemModel';
import { FC, Fragment } from 'react';

import {
  MediaItemDisplayFormat,
  useMediaItemDisplayFormat,
} from '../hooks/useMediaItemDisplayFormat';
import {
  MediaItemPresentationSettings,
  MediaItemViewCard,
  MediaItemViewList,
  MediaItemViewPoster,
  MediaItemViewPosterMinimal,
} from './MediaItemViews';
import { cx, getListItemKey } from '../utils';

export const ItemsParentContainer: FC<{
  items: {
    mediaItem: MediaItemResponse;
    season?: SeasonResponse | null;
    episode?: EpisodeResponse | null;
  }[];
  settings?: MediaItemPresentationSettings;
}> = (props) => {
  const { items, settings } = props;

  const { getDisplayFormat } = useMediaItemDisplayFormat();
  const displayFormat = getDisplayFormat();

  return (
    <div
      className={cx(
        'font-[Inter] text-[#222F4A] justify-center md:justify-start ',
        displayFormat === 'list'
          ? 'grid gap-2 gap-x-4 '
          : ' flex-wrap flex gap-8'
      )}
      style={
        displayFormat === 'list'
          ? {
              gridTemplateColumns: `40px ${' auto'.repeat(
                2 +
                  [
                    settings?.showRating,
                    settings?.showLastAiring,
                    settings?.showNextAiring,
                    settings?.showAddToSeenHistoryButton,
                    settings?.showAddFirstUnwatchedEpisodeToSeenHistoryButton,
                    settings?.showAddOrRemoveFromWatchlistButton,
                    settings?.showNumberOfUnseenEpisodes,
                  ].filter(Boolean).length
              )}`,
            }
          : {}
      }
    >
      {items.map((item) => (
        <Fragment key={getListItemKey(item)}>
          <ItemFromDisplayFormat
            displayFormat={displayFormat}
            mediaItem={item.mediaItem}
            settings={settings}
          />
        </Fragment>
      ))}
    </div>
  );
};

const ItemFromDisplayFormat: FC<{
  displayFormat: MediaItemDisplayFormat;
  mediaItem: MediaItemResponse;
  settings?: MediaItemPresentationSettings;
}> = (props) => {
  const { displayFormat, mediaItem, settings } = props;

  switch (displayFormat) {
    case 'card':
      return <MediaItemViewCard mediaItem={mediaItem} settings={settings} />;
    case 'poster':
      return <MediaItemViewPoster mediaItem={mediaItem} settings={settings} />;
    case 'poster-minimal':
      return (
        <MediaItemViewPosterMinimal mediaItem={mediaItem} settings={settings} />
      );
    case 'list':
      return <MediaItemViewList mediaItem={mediaItem} settings={settings} />;
  }
};
