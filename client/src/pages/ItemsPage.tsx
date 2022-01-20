import React, { FunctionComponent } from 'react';

import { MediaType } from 'mediatracker-api';
import { PaginatedGridItems } from 'src/components/PaginatedGridItems';

export const ItemsPage: FunctionComponent<{ mediaType?: MediaType }> = (
  props
) => {
  const { mediaType } = props;

  return (
    <PaginatedGridItems
      args={{
        mediaType: mediaType,
        orderBy: 'lastSeen',
        sortOrder: 'desc',
      }}
      showSortOrderControls={true}
      showSearch={true}
      gridItemAppearance={{
        showRating: true,
        showAddToWatchlistAndMarkAsSeenButtons: true,
        topBar: {
          showFirstUnwatchedEpisodeBadge: true,
          showOnWatchlistIcon: true,
          showUnwatchedEpisodesCount: true,
        },
      }}
    />
  );
};
