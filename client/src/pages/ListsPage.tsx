import { FC } from 'react';
import { Link } from 'react-router-dom';

import { Plural, Trans } from '@lingui/macro';

import { Accent } from '../components/Accent';
import { Button } from '../components/Button';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { dialogActionFactory } from '../components/Dialog';
import { Form } from '../components/Form';
import { AddIcon, DeleteIcon, EditIcon, SaveIcon } from '../components/Icons';
import { MainTitle } from '../components/MainTitle';
import { listSortByElements } from '../utils';
import { trpc } from '../utils/trpc';
import { TranslatedListSortBy } from './settings/HomePageSettingsPage';

import type {
  ListPrivacy,
  ListSortBy,
  ListSortOrder,
} from '@server/entity/listModel';

export const ListsPage: FC = () => {
  const { data, isLoading } = trpc.list.getUserLists.useQuery();

  if (isLoading) {
    return <Trans>Loading</Trans>;
  }

  return (
    <>
      <MainTitle>
        <Trans>Lists</Trans>
      </MainTitle>

      <AddOrEditListPopupAction>
        <Button
          className="mb-4"
          actionType="submit"
          text={<Trans>Add list</Trans>}
          icon={<AddIcon />}
        />
      </AddOrEditListPopupAction>

      <div className="flex flex-col gap-6">
        {data?.map((list) => (
          <div key={list.id} className="">
            <div>
              <Link
                className="text-lg font-semibold"
                to={`/list/${list.id.toString()}`}
              >
                {list.name}
              </Link>
            </div>

            <div className="text-sm text-slate-600">
              <Plural value={list.numberOfItems} one="1 item" other="# items" />
            </div>

            {list.description && <div>{list.description}</div>}

            <div className="flex gap-3 mt-2">
              <AddOrEditListPopupAction listId={list.id}>
                <Button
                  type="secondary"
                  text={<Trans>Edit list</Trans>}
                  icon={<EditIcon />}
                />
              </AddOrEditListPopupAction>

              {!list.isWatchlist && (
                <DeleteListButton listId={list.id} listName={list.name} />
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

const AddOrEditListPopupAction = dialogActionFactory<{ listId?: number }>(
  (props) => {
    const { listId, closeDialog } = props;
    const isEditing = typeof listId === 'number';

    const utils = trpc.useUtils();
    const listsQuery = trpc.list.getUserLists.useQuery(undefined, {
      enabled: isEditing,
    });

    const invalidate = () => {
      listId && utils.list.getList.invalidate({ listId });
      utils.list.getUserLists.invalidate();
    };

    const createListMutation = trpc.list.createList.useMutation({
      onSuccess: invalidate,
    });
    const updateListMutation = trpc.list.updateList.useMutation({
      onSuccess: invalidate,
    });

    const list = isEditing
      ? listsQuery.data?.find((list) => list.id === listId)
      : undefined;

    if (isEditing && !list) {
      return <Trans>Loading</Trans>;
    }

    return (
      <>
        <Form<{
          name: string;
          description: string;
          privacy: ListPrivacy;
          sortOrder: ListSortOrder;
          sortBy: ListSortBy;
        }>
          className="flex flex-col md:w-96"
          initialValues={
            isEditing
              ? {
                  description: list!.description || '',
                  name: list!.name,
                  privacy: list!.privacy,
                  sortBy: list!.sortBy,
                  sortOrder: list!.sortOrder,
                }
              : {}
          }
          onSubmit={async ({ data }) => {
            if (isEditing) {
              await updateListMutation.mutateAsync({
                id: list!.id,
                list: data,
              });
            } else {
              await createListMutation.mutateAsync(data);
            }
            closeDialog();
          }}
        >
          {({ TextInput, SelectInput }) => (
            <>
              <h1 className="mb-8 text-xl font-bold">
                {isEditing ? (
                  <Trans>
                    Edit list <Accent>{list!.name}</Accent>
                  </Trans>
                ) : (
                  <Trans>Add new list</Trans>
                )}
              </h1>

              <TextInput
                inputName="name"
                title={<Trans>Name</Trans>}
                required
                minLength={3}
                disabled={list?.isWatchlist === true}
              />

              <TextInput
                inputName="description"
                title={<Trans>Description</Trans>}
                rows={4}
              />

              <SelectInput
                inputName="privacy"
                title={<Trans>Visibility</Trans>}
                options={[
                  {
                    value: 'public',
                    name: <Trans>Public</Trans>,
                  },
                  {
                    value: 'private',
                    name: <Trans>Private</Trans>,
                  },
                ]}
              />

              <SelectInput
                inputName="sortBy"
                title={<Trans>Sort by</Trans>}
                options={listSortByElements.map((item) => ({
                  value: item,
                  name: <TranslatedListSortBy sortBy={item} />,
                }))}
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

              {createListMutation.isError && (
                <div>{createListMutation.error.message}</div>
              )}
              {updateListMutation.isError && (
                <div>{updateListMutation.error.message}</div>
              )}
              <div className="flex justify-between mt-4">
                {isEditing ? (
                  <Button
                    actionType="submit"
                    text={<Trans>Save list</Trans>}
                    icon={<SaveIcon />}
                    isLoading={updateListMutation.isLoading}
                  />
                ) : (
                  <Button
                    actionType="submit"
                    text={<Trans>Add list</Trans>}
                    icon={<AddIcon />}
                    isLoading={createListMutation.isLoading}
                  />
                )}
                <Button
                  preventDefault
                  onClick={closeDialog}
                  text={<Trans>Close</Trans>}
                />
              </div>
            </>
          )}
        </Form>
      </>
    );
  }
);

const useDeleteList = () => {
  const utils = trpc.useUtils();

  const deleteListMutation = trpc.list.delete.useMutation({
    onSuccess: () => {
      utils.list.getUserLists.invalidate();
    },
  });

  return {
    deleteListMutation,
  };
};

const DeleteListButton: FC<{ listId: number; listName: string }> = (props) => {
  const { listId, listName } = props;

  const { deleteListMutation } = useDeleteList();

  return (
    <ConfirmDialog
      content={
        <Trans>
          Are you sure, you want to delete list <Accent>{listName}</Accent>?
        </Trans>
      }
      onConfirmed={() => deleteListMutation.mutateAsync({ id: listId })}
    >
      <Button
        text={<Trans>Delete list</Trans>}
        icon={<DeleteIcon />}
        color="red"
        type="secondary"
      />
    </ConfirmDialog>
  );
};
