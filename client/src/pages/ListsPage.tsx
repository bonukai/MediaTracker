import React, { FunctionComponent } from 'react';
import { Plural, Trans } from '@lingui/macro';

import { useSearchParams } from 'react-router-dom';
import { useLists } from 'src/api/lists';
import { Link } from 'react-router-dom';
import { useUser } from 'src/api/user';
import {
  AddListButton,
  EditListButton,
} from 'src/components/AddOrEditListButton';
import { listDescription, listName } from 'src/utils';

export const ListsPage: FunctionComponent = () => {
  const [searchParams] = useSearchParams();
  const { user } = useUser();

  const userId = searchParams.has('userId')
    ? Number(searchParams.get('userId'))
    : user.id;

  const canEditOrAddList = userId === user.id;

  const { lists } = useLists({
    userId: userId,
  });

  if (!lists) {
    return <Trans>Loading</Trans>;
  }

  return (
    <>
      {canEditOrAddList && (
        <div className="mb-3">
          <AddListButton />
        </div>
      )}

      {lists.map((list) => (
        <div key={list.id} className="mb-5">
          <div className="flex items-center my-1">
            <div className="text-xl">
              <Link to={`/list/${list.id}`}>{listName(list)}</Link>
            </div>

            {canEditOrAddList && (
              <div className="pl-2 text-xs">
                <EditListButton list={list} />
              </div>
            )}
          </div>

          <div>
            <Plural value={list.itemsCount} one="# item" other="# items" />
          </div>

          <div className="overflow-hidden whitespace-nowrap text-ellipsis">
            {listDescription(list)}
          </div>
        </div>
      ))}
    </>
  );
};
