import React, { FunctionComponent } from 'react';
import { PaginatedGridItems } from 'src/components/PaginatedGridItems';

export const InProgressPage: FunctionComponent = () => {
  return (
    <PaginatedGridItems
      args={{
        orderBy: 'lastSeen',
        sortOrder: 'desc',
        onlyWithProgress: true,
        onlyOnWatchlist: true,
      }}
      showSortOrderControls={false}
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
