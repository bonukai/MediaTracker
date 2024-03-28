import { FC } from 'react';

import { Trans } from '@lingui/macro';

import { ItemsParentContainer } from '../components/ItemsParentContainer';
import { MainTitle } from '../components/MainTitle';
import { usePagination } from '../components/Pagination';
import { SetItemDisplayType } from '../components/SetItemDisplayType';
import { trpc } from '../utils/trpc';

export const UpcomingPage: FC = () => {
  const watchlist = trpc.watchlist.get.useQuery();

  const numberOfItemsPerPage = 40;

  const { currentPageNumber, PaginationComponent } = usePagination();

  const upcomingItemsQuery = trpc.list.getListItemsPaginated.useQuery(
    {
      listId: watchlist.data?.id as number,
      page: currentPageNumber,
      sortOrder: 'asc',
      orderBy: 'next-airing',
      numberOfItemsPerPage: numberOfItemsPerPage,
    },
    {
      enabled: typeof watchlist.data?.id === 'number',
    }
  );

  return (
    <>
      <MainTitle>
        <Trans>Upcoming</Trans>
      </MainTitle>

      <SetItemDisplayType />

      {upcomingItemsQuery.data && (
        <>
          <div>{upcomingItemsQuery.data.totalNumberOfItems} items</div>
          <ItemsParentContainer
            items={upcomingItemsQuery.data.items}
            settings={{
              showNextAiring: true,
            }}
          />

          <PaginationComponent
            numberOfPages={upcomingItemsQuery.data.totalNumberOfPages}
          />
        </>
      )}
    </>
  );
};
