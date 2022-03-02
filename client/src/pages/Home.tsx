import React, { FunctionComponent } from 'react';
import { t } from '@lingui/macro';

import { MediaItemItemsResponse } from 'mediatracker-api';
import { useItems } from 'src/api/items';
import { GridItem, GridItemAppearanceArgs } from 'src/components/GridItem';
import { subDays } from 'date-fns';

const Segment: FunctionComponent<{
  title: string;
  items: MediaItemItemsResponse[];
  gridItemArgs?: GridItemAppearanceArgs;
}> = (props) => {
  const { title, items, gridItemArgs } = props;

  return (
    <>
      {items?.length > 0 && (
        <div className="mb-10">
          <div className="text-2xl font-bold">{title}</div>
          <div className="flex flex-row flex-wrap mt-4">
            {items?.slice(0, 5).map((item) => (
              <div key={item.id} className="w-40 mr-5">
                <GridItem mediaItem={item} appearance={gridItemArgs} />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export const HomePage: FunctionComponent = () => {
  const { items: upcomingEpisodes } = useItems({
    orderBy: 'nextAiring',
    sortOrder: 'asc',
    page: 1,
    onlyOnWatchlist: true,
    onlyWithNextAiring: true,
  });

  const { items: continueWatching } = useItems({
    mediaType: 'tv',
    orderBy: 'lastSeen',
    sortOrder: 'desc',
    page: 1,
    onlyWithNextEpisodesToWatch: true,
    onlyOnWatchlist: true,
  });

  const { items: recentlyReleased } = useItems({
    orderBy: 'lastAiring',
    sortOrder: 'desc',
    page: 1,
    onlyOnWatchlist: true,
  });

  const { items: unratedItems } = useItems({
    orderBy: 'lastSeen',
    sortOrder: 'desc',
    page: 1,
    onlySeenItems: true,
    onlyWithoutUserRating: true,
  });

  return (
    <div className="px-2">
      <Segment
        title={t`Upcoming`}
        items={upcomingEpisodes}
        gridItemArgs={{
          showRating: true,
          showNextAiring: true,
          topBar: {
            showFirstUnwatchedEpisodeBadge: true,
            showOnWatchlistIcon: true,
            showUnwatchedEpisodesCount: true,
          },
        }}
      />

      <Segment
        title={t`Next episode to watch`}
        items={continueWatching}
        gridItemArgs={{
          showRating: true,
          showFirstUnwatchedEpisode: true,
          showAddToWatchlistAndMarkAsSeenButtons: true,
          topBar: {
            showFirstUnwatchedEpisodeBadge: true,
            showOnWatchlistIcon: true,
            showUnwatchedEpisodesCount: true,
          },
        }}
      />

      <Segment
        title={t`Recently released`}
        items={recentlyReleased?.filter(
          (mediaItem) =>
            new Date(mediaItem.lastAiring) > subDays(new Date(), 30)
        )}
        gridItemArgs={{
          showRating: true,
          showLastAiring: true,
          topBar: {
            showFirstUnwatchedEpisodeBadge: true,
            showOnWatchlistIcon: true,
            showUnwatchedEpisodesCount: true,
          },
        }}
      />

      <Segment
        title={t`Unrated`}
        items={unratedItems}
        gridItemArgs={{
          showRating: true,
          topBar: {
            showFirstUnwatchedEpisodeBadge: true,
            showOnWatchlistIcon: true,
            showUnwatchedEpisodesCount: true,
          },
        }}
      />
    </div>
  );
};
