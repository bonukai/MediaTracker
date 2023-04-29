import React, { FunctionComponent, useEffect, useState } from 'react';
import { Plural, t, Trans } from '@lingui/macro';
import { useParams } from 'react-router-dom';

import { GridItem } from 'src/components/GridItem';
import { Pagination } from 'src/components/PaginatedGridItems';
import { ListSortOrder } from 'mediatracker-api';
import { FormatDuration } from 'src/components/date';
import { useMenuComponent } from 'src/hooks/menu';
import { EditListButton } from 'src/components/AddOrEditListButton';
import { Link } from 'react-router-dom';
import { useSortedList } from 'src/hooks/sortedList';
import { useListSortByKeys } from 'src/hooks/translations';
import { useList } from 'src/api/list';
import { useListItems } from 'src/api/listItems';
import { usePagination } from 'src/hooks/pagination';
import { listDescription, listName } from 'src/utils';
import { useDarkMode } from 'src/hooks/darkMode';

export const ListPage: FunctionComponent = () => {
  const { listId } = useParams();
  const { darkMode } = useDarkMode();

  const { list } = useList({ listId: Number(listId) });
  const { listItems } = useListItems({ listId: Number(listId) });

  const [searchQuery, setSearchQuery] = useState('');

  const sortByTranslation = useListSortByKeys();

  const [sortOrder, setSortOrder] = useState<ListSortOrder>(list?.sortOrder);

  useEffect(() => {
    if (sortOrder === undefined && list !== undefined) {
      setSortOrder(list.sortOrder);
    }
  }, [sortOrder, list]);

  const { Menu: OrderByMenuComponent, selectedValue: translatedSortBy } =
    useMenuComponent({
      values: sortByTranslation.translations.sort(),
      initialSelection: sortByTranslation.keyToTranslation(list?.sortBy),
    });

  const sortBy = sortByTranslation.translationToKey(translatedSortBy);

  const filteredItems = searchQuery
    ? listItems.filter(
        (listItem) =>
          listItem.mediaItem.title
            ?.toLowerCase()
            ?.includes(searchQuery.toLowerCase()) ||
          listItem.rank === Number(searchQuery)
      )
    : listItems;

  const {
    currentPage,
    numberOfPages,
    setPage,
    getPaginatedItems,
    showPaginationComponent,
  } = usePagination({
    itemsPerPage: 24,
    totalItems: filteredItems?.length,
  });

  const data = getPaginatedItems(
    useSortedList({
      listItems: filteredItems,
      sortBy: sortByTranslation.translationToKey(translatedSortBy),
      sortOrder: sortOrder,
    })
  );

  if (!listItems || !list) {
    return <Trans>Loading</Trans>;
  }

  return (
    <>
      <div className="flex flex-row flex-wrap items-grid">
        <div className="header">
          <div className="flex items-center my-2">
            <div className="text-xl">
              <Link to={`/list/${list.id}`}>{listName(list)}</Link>
            </div>
            <div className="ml-2 text-xs">
              <EditListButton list={list} />
            </div>
          </div>

          <div className="mb-3 whitespace-pre">{listDescription(list)}</div>

          <div>
            <FormatDuration milliseconds={list.totalRuntime * 60 * 1000} />
          </div>

          {list.traktId && (
            <div className="py-4">
              <a href={`https://trakt.tv/lists/${list.traktId}`}>
                <img
                  src={
                    darkMode ? 'logo/trakt-white.svg' : 'logo/trakt-black.svg'
                  }
                  className="inline-block h-8"
                />
              </a>
            </div>
          )}

          <div>
            <input
              className="my-2 w-80"
              placeholder={t`Search list`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
            />
          </div>

          <div className="flex mt-3 mb-1">
            <Plural value={filteredItems.length} one="1 item" other="# items" />
            <div></div>
            <div className="ml-auto"></div>

            <div
              onClick={() =>
                setSortOrder((value) => (value === 'asc' ? 'desc' : 'asc'))
              }
              className="ml-2 cursor-pointer select-none"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </div>
            <OrderByMenuComponent>{translatedSortBy}</OrderByMenuComponent>
          </div>
        </div>
        {data.map((listItem) => (
          <React.Fragment key={listItem.id.toString()}>
            <GridItem
              mediaItem={listItem.mediaItem}
              season={listItem.season}
              episode={listItem.episode}
              appearance={{
                topBar: {
                  showFirstUnwatchedEpisodeBadge: true,
                  showOnWatchlistIcon: true,
                  showUnwatchedEpisodesCount: true,
                },
                showAddToWatchlistAndMarkAsSeenButtons: true,
                showFirstUnwatchedEpisode: true,
                showRating: true,
                showTotalRuntime: sortBy === 'runtime',
                showReleaseDate: sortBy === 'release-date',
                showLastSeenAt: sortBy === 'recently-watched',
                showLastAiring: sortBy === 'recently-aired',
                showNextAiring: sortBy === 'next-airing',
              }}
            />
          </React.Fragment>
        ))}

        {showPaginationComponent && (
          <Pagination
            numberOfPages={numberOfPages}
            page={currentPage}
            setPage={setPage}
          />
        )}
      </div>
    </>
  );
};
