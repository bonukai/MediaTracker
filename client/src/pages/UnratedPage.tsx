import { FC } from 'react';

import { Trans } from '@lingui/macro';

import { ItemsParentContainer } from '../components/ItemsParentContainer';
import { MainTitle } from '../components/MainTitle';
import { usePagination } from '../components/Pagination';
import { SetItemDisplayType } from '../components/SetItemDisplayType';
import { trpc } from '../utils/trpc';

export const UnratedPage: FC = () => {
  const numberOfItemsPerPage = 40;
  const { currentPageNumber, PaginationComponent } = usePagination();

  const unratedItemsQuery = trpc.mediaItem.unrated.useQuery({
    page: currentPageNumber,
    numberOfItemsPerPage: numberOfItemsPerPage,
  });

  return (
    <>
      <MainTitle>
        <Trans>Unrated</Trans>
      </MainTitle>

      <SetItemDisplayType />

      {unratedItemsQuery.data && (
        <>
          <div>{unratedItemsQuery.data.totalNumberOfItems} items</div>
          <ItemsParentContainer
            items={unratedItemsQuery.data.items.map((item) => ({
              mediaItem: item,
            }))}
            settings={{
              showRating: true,
            }}
          />
          <PaginationComponent
            numberOfPages={unratedItemsQuery.data.totalNumberOfPages}
          />
        </>
      )}
    </>
  );
};
