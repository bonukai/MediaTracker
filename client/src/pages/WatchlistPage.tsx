import React, { FunctionComponent } from 'react';
import { PaginatedGridItems } from 'src/components/PaginatedGridItems';

export const WatchlistPage: FunctionComponent = () => {
  return (
    <PaginatedGridItems
      args={{
        orderBy: 'lastSeen',
        sortOrder: 'desc',
        onlyOnWatchlist: true,
      }}
      showSortOrderControls={true}
      showSearch={false}
      gridItemAppearance={{
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
