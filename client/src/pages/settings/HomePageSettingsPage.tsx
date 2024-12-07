import { FC, useState } from 'react';

import { t, Trans } from '@lingui/macro';

import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { dialogActionFactory } from '../../components/Dialog';
import { Form } from '../../components/Form';
import {
  AddIcon,
  DeleteIcon,
  DownArrowIcon,
  EditIcon,
  UpArrowIcon,
  VisibilityIcon,
  VisibilityOffIcon,
} from '../../components/Icons';
import { JustWatchProvidersSelector } from '../../components/JustWatchProvidersSelector';
import { MainTitle } from '../../components/MainTitle';
import { MediaTypeTranslation } from '../../components/Translations';
import {
  booleanToYesNoAll,
  cx,
  listSortByElements,
  mediaTypesElements,
  stringToYesNoUndefined,
} from '../../utils';
import { trpc } from '../../utils/trpc';

import type {
  HomeScreenBuiltinSectionName,
  HomeSectionConfig,
} from '@server/entity/homeSectionModel';

import type { ListSortBy, ListSortOrder } from '@server/entity/listModel';
import type { MediaType } from '@server/entity/mediaItemModel';
// eslint-disable-next-line react-refresh/only-export-components
export const useHomeSection = () => {
  const utils = trpc.useUtils();
  const onMutationSuccess = () => {
    utils.homeSection.get.invalidate();
  };

  const itemsQuery = trpc.homeSection.get.useQuery();

  const update = trpc.homeSection.update.useMutation({
    onSuccess: onMutationSuccess,
  });
  const move = trpc.homeSection.move.useMutation({
    onSuccess: onMutationSuccess,
  });
  const remove = trpc.homeSection.delete.useMutation({
    onSuccess: onMutationSuccess,
  });
  const create = trpc.homeSection.create.useMutation({
    onSuccess: onMutationSuccess,
  });

  return {
    itemsQuery,
    update,
    move,
    remove,
    create,
  };
};

export const HomePageSettingsPage: FC = () => {
  const homeSection = useHomeSection();

  if (homeSection.itemsQuery.isLoading) {
    return <Trans>Loading</Trans>;
  }

  return (
    <>
      <div>
        <MainTitle
          elements={[<Trans>Settings</Trans>, <Trans>Home screen</Trans>]}
        />

        <div className="mb-4">
          <AddOrEditHomeScreenSection>
            <Button icon={<AddIcon />} text={<Trans>Add section</Trans>} />
          </AddOrEditHomeScreenSection>
        </div>

        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 w-fit">
          {homeSection.itemsQuery.data?.map((item, index) => (
            <div
              key={item.id}
              className=" p-2 mb-2 rounded bg-zinc-100 grid grid-cols-[subgrid] col-span-full items-center justify-center align-middle"
            >
              <div className="">
                {item.config.type === 'builtin' ? (
                  <TranslatedHomeScreenBuiltinSectionName
                    name={item.config.name}
                  />
                ) : (
                  <div>{item.config.name}</div>
                )}
              </div>

              <div>
                {item.config.type === 'list-view' && (
                  <ConfirmDialog
                    content={
                      <Trans>
                        Are you sure, you want to delete home section{' '}
                        <span className="font-semibold text-pink-600">
                          {item.config.name}
                        </span>
                        ?
                      </Trans>
                    }
                    onConfirmed={() =>
                      homeSection.remove.mutate({
                        id: item.id,
                      })
                    }
                  >
                    <Button
                      type="secondary"
                      color="red"
                      icon={<DeleteIcon />}
                      text={<Trans>Delete</Trans>}
                    />
                  </ConfirmDialog>
                )}
              </div>
              <div>
                {item.config.type === 'list-view' && (
                  <AddOrEditHomeScreenSection sectionId={item.id}>
                    <Button
                      type="secondary"
                      icon={<EditIcon />}
                      text={<Trans>Edit</Trans>}
                    />
                  </AddOrEditHomeScreenSection>
                )}
              </div>

              <div>
                {item.config.hidden === false ? (
                  <Button
                    type="secondary"
                    icon={<VisibilityIcon />}
                    text={<Trans>Visible</Trans>}
                    onClick={async () =>
                      homeSection.update.mutate({
                        id: item.id,
                        config: {
                          ...item.config,
                          hidden: true,
                        },
                      })
                    }
                  />
                ) : (
                  <Button
                    type="secondary"
                    icon={<VisibilityOffIcon />}
                    text={<Trans>Hidden</Trans>}
                    onClick={async () =>
                      homeSection.update.mutate({
                        id: item.id,
                        config: {
                          ...item.config,
                          hidden: false,
                        },
                      })
                    }
                  />
                )}
              </div>

              <div className="flex w-fit">
                <span
                  onClick={() =>
                    homeSection.move.mutateAsync({
                      direction: 'up',
                      id: item.id,
                    })
                  }
                >
                  <UpArrowIcon className={cx(index === 0 && 'fill-gray-400')} />
                </span>
                <span
                  onClick={() =>
                    homeSection.move.mutateAsync({
                      direction: 'down',
                      id: item.id,
                    })
                  }
                >
                  <DownArrowIcon
                    className={cx(
                      homeSection.itemsQuery.data &&
                        index === homeSection.itemsQuery.data.length - 1 &&
                        'fill-gray-400'
                    )}
                  />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export const AddOrEditHomeScreenSection = dialogActionFactory<{
  sectionId?: number;
}>((props) => {
  const { sectionId, closeDialog } = props;
  const homeSection = useHomeSection();

  const lists = trpc.list.getUserLists.useQuery();

  const homeScreenSection = homeSection.itemsQuery.data?.find(
    (item) => item.id === sectionId && item.config.type === 'list-view'
  );

  const [selectedJustWatchProviders, setSelectedJustWatchProviders] = useState<
    number[]
  >(
    homeScreenSection?.config.type === 'list-view'
      ? homeScreenSection.config.filters?.justWatchProviders || []
      : []
  );

  return (
    <>
      {lists.data && (
        <Form<
          {
            name: string;
            listId: number;
            sortOrder?: ListSortOrder;
            sortBy?: ListSortBy;
            onlyWithNextAiring?: boolean;
            onlyWithLastAiring?: boolean;
            seen?: 'yes' | 'no' | 'all';
            userRating?: 'yes' | 'no' | 'all';
            numberOfItems: number;
          } & {
            [Key in `mediaItems_${(typeof mediaTypesElements)[number]}`]: boolean;
          }
        >
          className="md:w-96"
          initialValues={
            homeScreenSection?.config.type === 'list-view'
              ? {
                  name: homeScreenSection.config.name,
                  listId: homeScreenSection.config.listId,
                  sortBy: homeScreenSection.config.orderBy,
                  sortOrder: homeScreenSection.config.sortOrder,
                  numberOfItems: homeScreenSection.config.numberOfItems,
                  seen: booleanToYesNoAll(
                    homeScreenSection.config.filters?.seen
                  ),
                  userRating: booleanToYesNoAll(
                    homeScreenSection.config.filters?.withUserRating
                  ),
                  ...homeScreenSection.config.filters?.itemTypes?.reduce(
                    (res, current) => ({
                      ...res,
                      [`mediaItems_${current}`]: true,
                    }),
                    {}
                  ),
                  onlyWithLastAiring:
                    homeScreenSection.config.filters?.onlyWithLastAiring,
                  onlyWithNextAiring:
                    homeScreenSection.config.filters?.onlyWithNextAiring,
                }
              : {
                  numberOfItems: 6,
                  ...mediaTypesElements.reduce(
                    (res, current) => ({
                      ...res,
                      [`mediaItems_${current}`]: true,
                    }),
                    {}
                  ),
                }
          }
          convertEmptyStringsToNull
          onSubmit={({ data, submitValidation }) => {
            if (!homeSection.itemsQuery.data) {
              return;
            }

            const section: HomeSectionConfig = {
              hidden: false,
              listId: Number(data.listId),
              name: data.name,
              type: 'list-view',
              sortOrder: data.sortOrder,
              orderBy: data.sortBy,
              numberOfItems: Number(data.numberOfItems),
              filters: {
                withUserRating: stringToYesNoUndefined(data.userRating),
                seen: stringToYesNoUndefined(data.seen),
                justWatchProviders:
                  selectedJustWatchProviders.length === 0
                    ? undefined
                    : selectedJustWatchProviders,
                itemTypes: [
                  data.mediaItems_audiobook && 'audiobook',
                  data.mediaItems_book && 'book',
                  data.mediaItems_tv && 'tv',
                  data.mediaItems_movie && 'movie',
                  data.mediaItems_video_game && 'video_game',
                ].filter((item): item is MediaType => typeof item === 'string'),
                onlyWithLastAiring: data.onlyWithLastAiring,
                onlyWithNextAiring: data.onlyWithNextAiring,
              },
            };

            if (
              homeSection.itemsQuery.data.find(
                (item) =>
                  item.config.name === section.name && item.id !== sectionId
              )
            ) {
              return submitValidation({
                inputName: 'name',
                message: t`there already exists a home section with name ${section.name}`,
              });
            }

            if (homeScreenSection) {
              homeSection.update.mutate({
                id: homeScreenSection.id,
                config: section,
              });
            } else {
              homeSection.create.mutate(section);
            }

            closeDialog();
          }}
        >
          {({
            TextInput,
            SelectInput,
            MultiCheckboxInput,
            NumberInput,
            CheckboxInput,
          }) => (
            <>
              <TextInput
                inputName="name"
                title={<Trans>Name</Trans>}
                required
                minLength={3}
                maxLength={40}
              />

              <SelectInput
                inputName="listId"
                title={<Trans>List</Trans>}
                options={lists.data.map((item) => ({
                  value: item.id.toString(),
                  name: item.name,
                }))}
              />

              <NumberInput
                inputName="numberOfItems"
                title={<Trans>Number of items</Trans>}
                min={1}
                max={40}
                required
              />

              <SelectInput
                inputName="sortBy"
                title={<Trans>Sort by</Trans>}
                options={listSortByElements.map((item) => ({
                  value: item,
                  name: <TranslatedListSortBy sortBy={item} />,
                }))}
              />

              <CheckboxInput
                inputName="onlyWithLastAiring"
                title={<Trans>Only items with a release in the past</Trans>}
              />

              <CheckboxInput
                inputName="onlyWithNextAiring"
                title={<Trans>Only items with a release in the future</Trans>}
              />

              <SelectInput
                inputName="sortOrder"
                title={<Trans>Sort order</Trans>}
                options={[
                  {
                    value: 'asc',
                    name: <Trans>Ascending</Trans>,
                  },
                  {
                    value: 'desc',
                    name: <Trans>Descending</Trans>,
                  },
                ]}
              />

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
                <Button actionType="submit">
                  <Trans>Save</Trans>
                </Button>
                <Button
                  color="red"
                  type="secondary"
                  onClick={closeDialog}
                  preventDefault
                >
                  <Trans>Cancel</Trans>
                </Button>
              </div>
            </>
          )}
        </Form>
      )}
    </>
  );
});

export const TranslatedHomeScreenBuiltinSectionName: FC<{
  name: HomeScreenBuiltinSectionName;
}> = (props) => {
  const { name } = props;

  if (name === 'builtin-section-next-episode-to-watch') {
    return <Trans>Next episode to watch</Trans>;
  } else if (name === 'builtin-section-recently-released') {
    return <Trans>Recently released</Trans>;
  } else if (name === 'builtin-section-unrated') {
    return <Trans>Unrated</Trans>;
  } else if (name === 'builtin-section-upcoming') {
    return <Trans>Upcoming</Trans>;
  }
};

export const TranslatedListSortBy: FC<{ sortBy: ListSortBy }> = (props) => {
  const { sortBy } = props;

  switch (sortBy) {
    case 'last-airing':
      return <Trans>Last airing</Trans>;
    case 'status':
      return <Trans>Status</Trans>;
    case 'listed':
      return <Trans>Listed</Trans>;
    case 'user-rating':
      return <Trans>User rating</Trans>;
    case 'unseen-episodes-count':
      return <Trans>Unseen episodes count</Trans>;
    case 'recently-added':
      return <Trans>Recently added</Trans>;
    case 'recently-watched':
      return <Trans>Recently watched</Trans>;
    case 'recently-aired':
      return <Trans>Recently aired</Trans>;
    case 'next-airing':
      return <Trans>Next airing</Trans>;
    case 'release-date':
      return <Trans>Release date</Trans>;
    case 'runtime':
      return <Trans>Runtime</Trans>;
    case 'progress':
      return <Trans>Progress</Trans>;
    case 'title':
      return <Trans>Title</Trans>;
    case 'last-seen':
      return <Trans>Last seen</Trans>;
    case 'media-type':
      return <Trans>Media type</Trans>;
  }
};
