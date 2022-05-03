import React, { FunctionComponent } from 'react';
import { Plural, Trans } from '@lingui/macro';

import { mediaTrackerApi } from 'src/api/api';
import { useDetails } from 'src/api/details';
import { useLists } from 'src/api/lists';
import { useUser } from 'src/api/user';
import { Modal } from 'src/components/Modal';
import { formatEpisodeNumber, formatSeasonNumber, listName } from 'src/utils';
import { AddListButton } from 'src/components/AddOrEditListButton';

export const AddToListModal: FunctionComponent<{
  mediaItemId: number;
  seasonId?: number;
  episodeId?: number;
  closeModal?: () => void;
}> = (props) => {
  const { mediaItemId, seasonId, episodeId, closeModal } = props;
  const { mediaItem } = useDetails(mediaItemId);
  const { user } = useUser();

  const { lists } = useLists({
    userId: user.id,
  });

  const { lists: listsWithItem, invalidateListsQuery } = useLists({
    userId: user.id,
    mediaItemId: mediaItemId,
    seasonId: seasonId,
    episodeId: episodeId,
  });

  if (!lists || !listsWithItem) {
    return <></>;
  }

  const season = seasonId
    ? mediaItem?.seasons?.find((season) => season.id === seasonId)
    : undefined;

  const episode = episodeId
    ? mediaItem?.seasons
        ?.flatMap((season) => season.episodes)
        ?.find((episode) => episode.id === episodeId)
    : undefined;

  if (!mediaItem || !user || !lists) {
    return <Trans>Loading</Trans>;
  }

  return (
    <div className="p-4">
      <div className="mb-2 text-2xl">
        <Trans>
          Add &quot;
          {episode
            ? `${mediaItem.title} ${formatEpisodeNumber(episode)}`
            : season
            ? `${mediaItem.title} ${formatSeasonNumber(season)}`
            : mediaItem.title}
          &quot; to list
        </Trans>
      </div>
      <ul>
        {lists.map((list) => (
          <div key={list.id} className="p-1">
            <label className="flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                className="mr-1"
                checked={Boolean(
                  listsWithItem.find((value) => value.id === list.id)
                )}
                onChange={async (e) => {
                  if (e.currentTarget.checked) {
                    await mediaTrackerApi.listItem.add({
                      listId: list.id,
                      mediaItemId: mediaItemId,
                      seasonId: seasonId,
                      episodeId: episodeId,
                    });
                  } else {
                    await mediaTrackerApi.listItem.removeItemFromList({
                      listId: list.id,
                      mediaItemId: mediaItemId,
                      seasonId: seasonId,
                      episodeId: episodeId,
                    });
                  }

                  invalidateListsQuery();
                }}
              />
              {listName(list)}
            </label>
          </div>
        ))}
      </ul>

      <div className="flex mt-2">
        <AddListButton />

        <div onClick={() => closeModal()} className="ml-auto btn-red">
          <Trans>Close</Trans>
        </div>
      </div>
    </div>
  );
};

export const AddToListButtonWithModal: FunctionComponent<{
  mediaItemId: number;
  seasonId?: number;
  episodeId?: number;
}> = (props) => {
  const { mediaItemId, seasonId, episodeId } = props;

  const { user } = useUser();
  const { lists } = useLists({
    userId: user.id,
  });

  const { lists: listsWithItem } = useLists({
    userId: user.id,
    mediaItemId: mediaItemId,
    seasonId: seasonId,
    episodeId: episodeId,
  });

  if (!lists || !listsWithItem) {
    return <></>;
  }

  return (
    <Modal
      openModal={(openModal) => (
        <>
          <div className="text-sm btn-blue" onClick={() => openModal()}>
            {listsWithItem?.length === 0 ? (
              <>
                {episodeId ? (
                  <Trans>Add episode to list</Trans>
                ) : seasonId ? (
                  <Trans>Add season to list</Trans>
                ) : (
                  <Trans>Add to list</Trans>
                )}
              </>
            ) : (
              <Plural
                value={listsWithItem?.length}
                one="Listed on 1 list"
                other="Listed on # lists"
              />
            )}
          </div>
        </>
      )}
    >
      {(closeModal) => (
        <AddToListModal
          mediaItemId={mediaItemId}
          seasonId={seasonId}
          episodeId={episodeId}
          closeModal={closeModal}
        />
      )}
    </Modal>
  );
};
