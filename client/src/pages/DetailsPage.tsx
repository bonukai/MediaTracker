import { FC, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { Plural, Trans } from '@lingui/macro';

import { Accent } from '../components/Accent';
import { Button } from '../components/Button';
import { dialogActionFactory } from '../components/Dialog';
import { justWatchLogo } from '../components/Logos';
import { AddSingleEpisodeToSeenHistoryAction } from '../components/MediaItemActionButtons';
import {
  AddFirstUnwatchedEpisodeToSeenHistoryButton,
  AddMediaItemToSeenHistoryButton,
  WatchlistButton,
} from '../components/MediaItemViews';
import { Poster } from '../components/Poster';
import { StarRatingComponent } from '../components/StarRatingComponent';
import { useInvalidateMediaItem } from '../hooks/mediaItemHooks';
import {
  hasProgress,
  hasReleaseDate,
  hasUnseenEpisodes,
  isAudiobook,
  isBook,
  isTvShow,
} from '../mediaItemHelpers';
import { cx } from '../utils';
import { trpc } from '../utils/trpc';
import { HistoryComponent } from './HistoryPage';

import type { MediaItemResponse } from '@server/entity/mediaItemModel';
export const DetailsPage: FC<{ mediaItemId: number }> = (props) => {
  const { mediaItemId } = props;

  const details = trpc.mediaItem.details.useQuery({
    mediaItemId: mediaItemId,
  });

  if (details.isLoading) {
    return <Trans>Loading</Trans>;
  }

  if (details.error?.data?.code === 'NOT_FOUND') {
    return <Navigate to="/404" />;
  }

  const mediaItem = details.data;

  return (
    <>
      <div className="p-8">
        {mediaItem && (
          <>
            <div className="flex flex-col md:flex-row">
              <div className="w-80 shrink-0">
                <Poster mediaItem={mediaItem} width={640} />
                <ButtonsSection mediaItem={mediaItem} />
                <JustWatchSection mediaItem={mediaItem} />
              </div>
              <div className="ml-4">
                <InfoSection mediaItem={mediaItem} />
                <HistoryComponent
                  seenHistory={
                    mediaItem.seenHistory?.map((item) => ({
                      duration: item.duration,
                      seenId: item.seenId,
                      seenAt: item.seenAt,
                      mediaItem: mediaItem,
                      episode: item.episodeId
                        ? mediaItem.seasons
                            ?.flatMap((season) => season.episodes)
                            .find(
                              (episode) => episode?.id === item.episodeId
                            ) || null
                        : null,
                    })) || []
                  }
                />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

const JustWatchSection: FC<{ mediaItem: MediaItemResponse }> = (props) => {
  const { mediaItem } = props;

  const { buy, flatrate, rent } = mediaItem.availability || {};

  if (
    (buy?.length === 0 || !buy) &&
    (flatrate?.length === 0 || !flatrate) &&
    (rent?.length === 0 || !rent)
  ) {
    return <></>;
  }

  return (
    <div className="flex flex-col gap-2">
      <JustWatchSingleSection
        displayName={<Trans>Stream at:</Trans>}
        providers={mediaItem.availability?.flatrate}
      />

      <JustWatchSingleSection
        displayName={<Trans>Rent at:</Trans>}
        providers={mediaItem.availability?.rent}
      />

      <JustWatchSingleSection
        displayName={<Trans>Buy at:</Trans>}
        providers={mediaItem.availability?.buy}
      />

      <div className="flex items-center gap-1 mt-1 text-sm text-slate-500">
        <Trans>
          Provided by
          <a href="https://www.justwatch.com/">
            <img
              src={justWatchLogo}
              className="inline-block h-3"
              alt="JustWatch logo"
            />
          </a>
        </Trans>
      </div>
    </div>
  );
};

const JustWatchSingleSection: FC<{
  displayName: ReactNode;
  providers?: { providerName: string; providerLogo: string }[];
}> = (props) => {
  const { displayName, providers } = props;

  if (!providers || providers?.length === 0) {
    return <></>;
  }

  return (
    <div>
      <div className="text-slate-700">{displayName}</div>
      <div className="flex gap-1">
        {providers.map((item) => (
          <div key={item.providerName} className="inline">
            <img
              src={item.providerLogo}
              alt={item.providerName}
              className="object-contain h-8 rounded"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const ButtonsSection: FC<{ mediaItem: MediaItemResponse }> = (props) => {
  const { mediaItem } = props;

  return (
    <div className="flex flex-col gap-2 mt-4">
      <UpdateMetadataButton mediaItem={mediaItem} />
      <AddMediaItemToSeenHistoryButton mediaItem={mediaItem} />
      {isTvShow(mediaItem) && (
        <AddSingleEpisodeToSeenHistoryButton mediaItem={mediaItem} />
      )}
      {isTvShow(mediaItem) && (
        <AddFirstUnwatchedEpisodeToSeenHistoryButton mediaItem={mediaItem} />
      )}
      <WatchlistButton mediaItem={mediaItem} />
      <AddToListButton mediaItem={mediaItem} />
      <StarRatingComponent mediaItem={mediaItem} />
    </div>
  );
};

const InfoSection: FC<{ mediaItem: MediaItemResponse }> = (props) => {
  const { mediaItem } = props;

  return (
    <>
      <div className="text-lg font-semibold">{mediaItem.title}</div>

      <div className="mt-1 text-slate-500">{mediaItem.overview}</div>

      {hasReleaseDate(mediaItem) && (
        <div>
          <Trans>
            Release date: {new Date(mediaItem.releaseDate).toLocaleDateString()}
          </Trans>
        </div>
      )}

      {(isAudiobook(mediaItem) || isBook(mediaItem)) && (
        <div>
          <Trans>Authors: {mediaItem.authors}</Trans>
        </div>
      )}

      {isAudiobook(mediaItem) && (
        <div>
          <Trans>Narrators: {mediaItem.narrators}</Trans>
        </div>
      )}

      {hasUnseenEpisodes(mediaItem) && (
        <div className="">
          <Plural
            value={mediaItem.unseenEpisodesCount}
            one={
              <Trans>
                <Accent>1</Accent> episode to watch
              </Trans>
            }
            other={
              <Trans>
                <Accent>#</Accent> episodes to watch
              </Trans>
            }
          />
        </div>
      )}

      <div>
        {mediaItem.lastSeenAt && (
          <Trans>
            Last seen at: {new Date(mediaItem.lastSeenAt).toLocaleString()}
          </Trans>
        )}
      </div>

      {hasProgress(mediaItem) && (
        <div className="relative h-3 rounded bg-sky-200">
          <div
            className={cx(
              'absolute h-full rounded-l bg-sky-600',
              mediaItem.progress.progress === 1 && 'rounded-r'
            )}
            style={{ width: `${mediaItem.progress.progress * 100}%` }}
          ></div>
        </div>
      )}
    </>
  );
};

const AddToListButton: FC<{ mediaItem: MediaItemResponse }> = (props) => {
  const { mediaItem } = props;

  return (
    <>
      {mediaItem.listedOn && (
        <AddToListAction mediaItem={mediaItem}>
          <Button
            text={
              mediaItem.listedOn.length === 0 ? (
                <Trans>Add to list</Trans>
              ) : (
                <Plural
                  value={mediaItem.listedOn.length}
                  one="Listed on 1 list"
                  other="Listed on # lists"
                />
              )
            }
          />
        </AddToListAction>
      )}
    </>
  );
};

const AddToListAction = dialogActionFactory<{ mediaItem: MediaItemResponse }>(
  (props) => {
    const { mediaItem, closeDialog } = props;

    const listsQuery = trpc.list.getUserLists.useQuery();

    const { invalidateMediaItem } = useInvalidateMediaItem(mediaItem);

    const addToListMutation = trpc.list.addItemToList.useMutation({
      onSuccess: invalidateMediaItem,
    });
    const removeFromListMutation = trpc.list.removeItemFromList.useMutation({
      onSuccess: invalidateMediaItem,
    });

    const setOfMediaItemLists = new Set(
      mediaItem.listedOn?.map((item) => item.listId)
    );

    return (
      <div className="md:w-96">
        <div className="mb-6 text-xl font-semibold">
          <Trans>
            <Accent>{mediaItem.title}</Accent> - lists
          </Trans>
        </div>

        <div className="flex flex-col gap-2">
          {listsQuery.data?.map((list) => (
            <label key={list.id} className="block">
              <input
                type="checkbox"
                checked={setOfMediaItemLists.has(list.id)}
                onChange={(e) => {
                  if (!e.currentTarget.checked) {
                    removeFromListMutation.mutate({
                      mediaItemId: mediaItem.id,
                      seasonId: null,
                      episodeId: null,
                      listId: list.id,
                    });
                  } else {
                    addToListMutation.mutate({
                      mediaItemId: mediaItem.id,
                      seasonId: null,
                      episodeId: null,
                      listId: list.id,
                    });
                  }
                }}
              />{' '}
              <span className="select-none text-slate-800">{list.name}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-end mt-4">
          <Button type="secondary" color="red" onClick={closeDialog}>
            <Trans>Close</Trans>
          </Button>
        </div>
      </div>
    );
  }
);

const UpdateMetadataButton: FC<{
  mediaItem: MediaItemResponse;
}> = (props) => {
  const { mediaItem } = props;
  const utils = trpc.useUtils();
  const mutation = trpc.mediaItem.updateMetadata.useMutation({
    onSuccess: () => {
      utils.mediaItem.details.invalidate({ mediaItemId: mediaItem.id });
    },
  });

  return (
    <Button
      onClick={() =>
        mutation.mutate({
          mediaItemId: mediaItem.id,
        })
      }
      text={<Trans>Update metadata</Trans>}
      isLoading={mutation.isLoading}
    />
  );
};

const AddSingleEpisodeToSeenHistoryButton: FC<{
  mediaItem: MediaItemResponse;
}> = (props) => {
  const { mediaItem } = props;

  return (
    <AddSingleEpisodeToSeenHistoryAction mediaItem={mediaItem}>
      <Button text={<Trans>Add single episode to seen history</Trans>} />
    </AddSingleEpisodeToSeenHistoryAction>
  );
};
