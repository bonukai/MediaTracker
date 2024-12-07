import { FC, ReactNode, useEffect, useState } from 'react';

import { Plural, Trans } from '@lingui/macro';

import { Accent } from '../components/Accent';
import { Button } from '../components/Button';
import { dialogActionFactory } from '../components/Dialog';
import { Form } from '../components/Form';
import { FilterIcon, RssIcon } from '../components/Icons';
import { ItemsParentContainer } from '../components/ItemsParentContainer';
import { JustWatchProvidersSelector } from '../components/JustWatchProvidersSelector';
import { MainTitle } from '../components/MainTitle';
import { Pagination } from '../components/Pagination';
import { SetItemDisplayType } from '../components/SetItemDisplayType';
import { MediaTypeTranslation } from '../components/Translations';
import { useApiTokenUrlMutation } from '../hooks/useApiTokenUrl';
import {
  booleanToYesNoAll,
  listSortByElements,
  mediaTypesElements,
  stringToYesNoUndefined,
} from '../utils';
import { trpc } from '../utils/trpc';
import { EmbeddedSingleLineCodeWithCopyButton } from '../components/EmbeddedSingleLineCodeWithCopyButton';
import { TranslatedListSortBy } from './settings/HomePageSettingsPage';

import type {
  ListItemsFilters,
  ListSortBy,
  ListSortOrder,
} from '@server/entity/listModel';
import type { MediaType } from '@server/entity/mediaItemModel';

const FilterListAction = dialogActionFactory<{
  listId: number;
  filters: ListItemsFilters;
  setFilters: (data: ListItemsFilters | undefined) => void;
}>((props) => {
  const { listId, closeDialog, filters, setFilters } = props;

  const list = trpc.list.getList.useQuery({
    listId: listId,
  });

  const [selectedJustWatchProviders, setSelectedJustWatchProviders] = useState<
    number[]
  >([]);

  return (
    <>
      {list.data && (
        <Form<
          {
            title: string;
            seen: 'all' | 'yes' | 'no';
            userRating: 'all' | 'yes' | 'no';
            onlyWithLastAiring: boolean;
            onlyWithNextAiring: boolean;
          } & {
            [A in `mediaItems_${(typeof mediaTypesElements)[number]}`]: boolean;
          }
        >
          className="md:w-96"
          initialValues={{
            ...mediaTypesElements.reduce(
              (res, current) => ({ ...res, [`mediaItems_${current}`]: true }),
              {}
            ),
            seen: booleanToYesNoAll(filters.seen),
            userRating: booleanToYesNoAll(filters.withUserRating),
            title: filters.title,
            onlyWithLastAiring: filters.onlyWithLastAiring,
            onlyWithNextAiring: filters.onlyWithNextAiring,
          }}
          onSubmit={async ({ data }) => {
            setFilters({
              title: data.title || undefined,
              itemTypes: [
                data.mediaItems_audiobook && 'audiobook',
                data.mediaItems_book && 'book',
                data.mediaItems_tv && 'tv',
                data.mediaItems_movie && 'movie',
                data.mediaItems_video_game && 'video_game',
              ].filter((item): item is MediaType => typeof item === 'string'),
              seen: stringToYesNoUndefined(data.seen),
              withUserRating: stringToYesNoUndefined(data.userRating),
              onlyWithLastAiring: data.onlyWithLastAiring,
              onlyWithNextAiring: data.onlyWithNextAiring,
              justWatchProviders:
                selectedJustWatchProviders.length > 0
                  ? selectedJustWatchProviders
                  : undefined,
            });

            closeDialog();
          }}
        >
          {({ TextInput, SelectInput, MultiCheckboxInput, CheckboxInput }) => (
            <>
              <h1 className="mb-6 text-xl font-semibold">
                <Trans>
                  Filter list <Accent>{list.data.name}</Accent>
                </Trans>
              </h1>

              <TextInput inputName="title" title={<Trans>Title</Trans>} />

              <SelectInput
                inputName="seen"
                title={<Trans>Seen</Trans>}
                options={[
                  { value: 'all', name: <Trans>All</Trans> },
                  { value: 'yes', name: <Trans>Only seen</Trans> },
                  { value: 'no', name: <Trans>Only unseen</Trans> },
                ]}
              />

              <SelectInput
                inputName="userRating"
                title={<Trans>User rating</Trans>}
                options={[
                  { value: 'all', name: <Trans>All</Trans> },
                  { value: 'yes', name: <Trans>Only with user rating</Trans> },
                  {
                    value: 'no',
                    name: <Trans>Only without user rating</Trans>,
                  },
                ]}
              />

              <CheckboxInput
                inputName="onlyWithLastAiring"
                title={<Trans>Only items with a release in the past</Trans>}
              />

              <CheckboxInput
                inputName="onlyWithNextAiring"
                title={<Trans>Only items with a release in the future</Trans>}
              />

              <MultiCheckboxInput
                title={<Trans>Media types</Trans>}
                checkboxes={mediaTypesElements.map((mediaType) => ({
                  name: <MediaTypeTranslation mediaType={mediaType} />,
                  inputName: `mediaItems_${mediaType}`,
                }))}
              />

              <div className="mb-1 font-semibold">
                <Trans>JustWatch providers</Trans>
              </div>

              <JustWatchProvidersSelector
                selectedJustWatchProviders={selectedJustWatchProviders}
                setSelectedJustWatchProviders={setSelectedJustWatchProviders}
              />

              <div className="flex justify-between ">
                <div className="flex gap-2">
                  <Button actionType="submit" text={<Trans>Filter</Trans>} />
                  <Button
                    preventDefault
                    type="secondary"
                    text={<Trans>Reset filters</Trans>}
                    onClick={() => {
                      setFilters(undefined);
                      closeDialog();
                    }}
                  />
                </div>

                <Button
                  color="red"
                  type="secondary"
                  preventDefault
                  onClick={() => closeDialog()}
                  text={<Trans>Cancel</Trans>}
                />
              </div>
            </>
          )}
        </Form>
      )}
    </>
  );
});

export const ListItemsPage: FC<{ listId: number }> = (props) => {
  const { listId } = props;
  const [listItemsFilters, setListItemsFilters] = useState<ListItemsFilters>();

  const listQuery = trpc.list.getList.useQuery({
    listId: listId,
  });

  const [sortOrder, setSortOrder] = useState<ListSortOrder | undefined>(
    listQuery.data?.sortOrder
  );
  const [orderBy, setOrderBy] = useState<ListSortBy | undefined>(
    listQuery.data?.sortBy
  );

  const numberOfItemsPerPage = 60;
  const [currentPageNumber, setCurrentPageNumber] = useState<number>(1);

  const listItemsQuery = trpc.list.getListItemsPaginated.useQuery(
    {
      listId: listId,
      page: currentPageNumber,
      numberOfItemsPerPage: numberOfItemsPerPage,
      sortOrder: sortOrder,
      orderBy: orderBy,
      filters: listItemsFilters,
    },
    {
      keepPreviousData: true,
    }
  );

  useEffect(() => {
    window.scrollTo({
      behavior: 'smooth',
      top: 0,
    });
  }, [currentPageNumber]);

  if (listQuery.isLoading) {
    return <Trans>Loading</Trans>;
  }

  return (
    <>
      {listQuery.data && (
        <>
          <MainTitle elements={[<Trans>Lists</Trans>, listQuery.data.name]} />

          <>
            <div>
              <div className="py-5 text-[16px] font-medium leading-tight tracking-wide">
                {listQuery.data.description && (
                  <div>{listQuery.data.description}</div>
                )}

                <Plural
                  value={listQuery.data.numberOfItems}
                  one="# item"
                  other="# items"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <SetItemDisplayType />

              <div className="flex items-center gap-2">
                <div>
                  <label>
                    <Trans>Sort by:</Trans>{' '}
                  </label>
                  <select
                    value={orderBy}
                    onChange={(e) =>
                      setOrderBy(e.currentTarget.value as ListSortBy)
                    }
                  >
                    {listSortByElements.map((item) => (
                      <option value={item} key={item}>
                        <TranslatedListSortBy sortBy={item} />
                      </option>
                    ))}
                  </select>
                </div>

                <select
                  value={sortOrder}
                  onChange={(e) =>
                    setSortOrder(e.currentTarget.value as ListSortOrder)
                  }
                >
                  <option value="asc">
                    <Trans>Ascending</Trans>
                  </option>
                  <option value="desc">
                    <Trans>Descending</Trans>
                  </option>
                </select>

                <FilterListAction
                  listId={listQuery.data.id}
                  filters={listItemsFilters || {}}
                  setFilters={setListItemsFilters}
                >
                  <Button icon={<FilterIcon />} text={<Trans>Filter</Trans>} />
                </FilterListAction>

                <RssIconAction listId={listQuery.data.id} />
                <JsonIconButton listId={listQuery.data.id} />
              </div>
            </div>
            {listItemsQuery.data && (
              <div className="">
                <ItemsParentContainer
                  items={listItemsQuery.data.items}
                  settings={{
                    showRating: true,
                  }}
                />
                <Pagination
                  numberOfPages={listItemsQuery.data.totalNumberOfPages}
                  pageNumber={currentPageNumber}
                  setPageNumber={setCurrentPageNumber}
                />
              </div>
            )}
          </>
        </>
      )}
    </>
  );
};

const CopyApiUrlAction = dialogActionFactory<{
  tokenMutationArgs: Parameters<typeof useApiTokenUrlMutation>['0'];
  dialogTitle: ReactNode;
  listId: number;
}>((props) => {
  const {
    closeDialog,
    tokenMutationArgs: tokenType,
    dialogTitle,
    listId,
  } = props;

  const tokenMutation = useApiTokenUrlMutation(tokenType);

  useEffect(() => {
    if (!tokenMutation.isLoading) {
      tokenMutation.mutate({
        listId,
      });
    }
  }, []);

  return (
    <>
      <div className="mb-8 text-xl font-semibold">{dialogTitle}</div>
      <div>
        {tokenMutation.data && (
          <EmbeddedSingleLineCodeWithCopyButton code={tokenMutation.data} />
        )}
      </div>
      <div className="flex justify-end mt-4">
        <Button
          type="secondary"
          color="red"
          preventDefault
          onClick={closeDialog}
        >
          <Trans>Close</Trans>
        </Button>
      </div>
    </>
  );
});

const RssIconAction: FC<{
  listId: number;
}> = (props) => {
  return (
    <CopyApiUrlAction
      dialogTitle={<Trans>RSS feed</Trans>}
      tokenMutationArgs={{ type: 'calendar-rss' }}
      listId={props.listId}
    >
      <Button icon={<RssIcon />} text={<Trans>RSS feed</Trans>} />
    </CopyApiUrlAction>
  );
};

const JsonIconButton: FC<{
  listId: number;
}> = (props) => {
  return (
    <CopyApiUrlAction
      dialogTitle={<Trans>JSON url</Trans>}
      tokenMutationArgs={{ type: 'list-items-json' }}
      listId={props.listId}
    >
      <Button text={<Trans>JSON url</Trans>} />
    </CopyApiUrlAction>
  );
};
