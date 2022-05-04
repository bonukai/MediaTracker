import React, { FunctionComponent, useState, useRef } from 'react';
import { Trans, t } from '@lingui/macro';
import { ListPrivacy, ListSortBy, ListSortOrder } from 'mediatracker-api';

import { mediaTrackerApi } from 'src/api/api';
import { useLists } from 'src/api/lists';
import { useUser } from 'src/api/user';
import { Modal } from 'src/components/Modal';
import {
  useListPrivacyKeys,
  useListSortByKeys,
  useSortOrderKeys,
} from 'src/hooks/translations';
import { listDescription, listName } from 'src/utils';
import { useLocation, useNavigate } from 'react-router-dom';
import { Confirm } from 'src/components/Confirm';

const AddOrEditListButton: FunctionComponent<{
  list?: {
    id: number;
    name: string;
    description?: string;
    sortBy?: ListSortBy;
    sortOrder?: ListSortOrder;
    isWatchlist: boolean;
    privacy: ListPrivacy;
  };
}> = (props) => {
  const { list } = props;

  return (
    <Modal
      openModal={(openModal) => (
        <button className="btn" onClick={() => openModal()}>
          {list ? <Trans>Edit list</Trans> : <Trans>Add list</Trans>}
        </button>
      )}
    >
      {(closeModal) => (
        <AddOrEditListModal closeModal={closeModal} list={list} />
      )}
    </Modal>
  );
};

const AddOrEditListModal: FunctionComponent<{
  closeModal: () => void;
  list?: {
    id: number;
    name: string;
    description?: string;
    sortBy?: ListSortBy;
    sortOrder?: ListSortOrder;
    isWatchlist: boolean;
    privacy: ListPrivacy;
  };
}> = (props) => {
  const { closeModal, list } = props;

  const { user } = useUser();
  const { lists, invalidateListsQuery } = useLists({ userId: user.id });

  const [name, setName] = useState(listName(list) || '');
  const [description, setDescription] = useState(listDescription(list) || '');
  const [privacy, setPrivacy] = useState<ListPrivacy>(
    list?.privacy || 'private'
  );
  const [sortBy, setSortBy] = useState<ListSortBy>(
    list?.sortBy || 'recently-watched'
  );
  const [sortOrder, setSortOrder] = useState<ListSortOrder>(
    list?.sortOrder || 'desc'
  );

  const listSortByKeys = useListSortByKeys();
  const listPrivacyKeys = useListPrivacyKeys();
  const sortOrderKeys = useSortOrderKeys();
  const location = useLocation();
  const navigate = useNavigate();

  const nameRef = useRef<HTMLInputElement>();

  const edit = Boolean(list);

  return (
    <form
      className="p-3 w-96"
      onSubmit={async (e) => {
        e.preventDefault();

        if (
          lists?.find(
            (value) => value.name === name && value.name !== list?.name
          )
        ) {
          nameRef.current?.setCustomValidity(
            t`There already exists a list with name "${name}"`
          );
          nameRef.current?.reportValidity();
        } else {
          if (edit) {
            await mediaTrackerApi.list.updateList({
              id: list?.id,
              name,
              description,
              privacy,
              sortBy,
              sortOrder,
            });
          } else {
            await mediaTrackerApi.list.addList({
              name,
              description,
              privacy,
              sortBy,
              sortOrder,
            });
          }
          invalidateListsQuery();
          closeModal();
        }
      }}
    >
      <div className="text-2xl">
        {edit ? <Trans>Edit list</Trans> : <Trans>New list</Trans>}
      </div>

      <label className="flex flex-col pt-2">
        <Trans>Name</Trans>:
        <input
          value={name}
          ref={nameRef}
          disabled={list?.isWatchlist}
          onChange={(e) => {
            setName(e.currentTarget?.value);
            e.currentTarget?.setCustomValidity('');
          }}
          required
        />
      </label>

      <label className="flex flex-col pt-2">
        <Trans>Description</Trans>:
        <textarea
          value={description}
          onChange={(e) => setDescription(e.currentTarget?.value)}
          disabled={list?.isWatchlist}
          rows={4}
        />
      </label>

      <label className="flex flex-col pt-2">
        <Trans>Privacy</Trans>:
        <select
          value={privacy}
          onChange={(e) => setPrivacy(e.currentTarget.value as ListPrivacy)}
        >
          {listPrivacyKeys.map((key, translation) => (
            <option value={key} key={key}>
              {translation}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col pt-2">
        <Trans>Sort by</Trans>:
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.currentTarget.value as ListSortBy)}
        >
          {listSortByKeys.map((key, translation) => (
            <option value={key} key={key}>
              {translation}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col pt-2">
        <Trans>Sort order</Trans>:
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.currentTarget.value as ListSortOrder)}
        >
          {sortOrderKeys.map((key, translation) => (
            <option value={key} key={key}>
              {translation}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-row mt-4">
        <button className="btn-blue">
          {edit ? <Trans>Save list</Trans> : <Trans>Add list</Trans>}
        </button>

        {edit && !list?.isWatchlist && (
          <div
            className="ml-2 btn-red"
            onClick={async () => {
              if (
                await Confirm(
                  t`Do you really want to remove list "${list.name}"`
                )
              ) {
                await mediaTrackerApi.list.deleteList({ listId: list.id });

                closeModal();

                if (location.pathname.startsWith('/list/')) {
                  navigate('/lists', {
                    replace: true,
                  });
                }

                invalidateListsQuery();
              }
            }}
          >
            <Trans>Delete list</Trans>
          </div>
        )}

        <div className="ml-auto btn" onClick={() => closeModal()}>
          Close
        </div>
      </div>
    </form>
  );
};

export const AddListButton: FunctionComponent = AddOrEditListButton;

export const EditListButton: FunctionComponent<{
  list: {
    id: number;
    name: string;
    description?: string;
    sortBy?: ListSortBy;
    sortOrder?: ListSortOrder;
    isWatchlist: boolean;
    privacy: ListPrivacy;
  };
}> = AddOrEditListButton;
