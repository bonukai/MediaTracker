import React, { FunctionComponent } from 'react';
import { PaginatedGridItems } from 'src/components/PaginatedGridItems';

export const UpcomingPage: FunctionComponent = () => {
  return (
    <PaginatedGridItems
      args={{
        orderBy: 'nextAiring',
        sortOrder: 'asc',
        onlyOnWatchlist: true,
        onlyWithNextAiring: true,
      }}
      showSortOrderControls={false}
      showSearch={false}
      gridItemAppearance={{
        showNextAiring: true,
        showRating: true,
        topBar: {
          showFirstUnwatchedEpisodeBadge: true,
          showOnWatchlistIcon: true,
          showUnwatchedEpisodesCount: true,
        },
      }}
    />
  );
};
