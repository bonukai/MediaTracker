import React, { FC, ReactNode, useEffect, useState } from 'react';

import { Plural, Trans } from '@lingui/macro';

import { useInvalidateMediaItem } from '../hooks/mediaItemHooks';
import { useUndoPopup } from '../hooks/useUndoPopup';
import { formatEpisodeNumber, hasBeenReleased } from '../mediaItemHelpers';
import { trpc } from '../utils/trpc';
import { Button } from './Button';
import { Dialog, dialogActionFactory } from './Dialog';
import { SelectSeenDateComponent } from './SelectSeenDateComponent';

import type {
  EpisodeResponse,
  MediaItemResponse,
} from '@server/entity/mediaItemModel';

const AddEpisodeToSeenHistoryAction = dialogActionFactory<{
  mediaItem: MediaItemResponse;
  episode: EpisodeResponse;
}>((props) => {
  const { closeDialog, mediaItem, episode } = props;
  const { addPopup } = useUndoPopup();

  const { invalidateMediaItem } = useInvalidateMediaItem(mediaItem);

  const addMutation = trpc.seen.markEpisodesAsSeen.useMutation({
    onSuccess: () => {
      invalidateMediaItem();
      closeDialog();
    },
  });

  const deleteMutation = trpc.seen.deleteMany.useMutation({
    onSuccess: invalidateMediaItem,
  });

  return (
    <SelectSeenDateComponent
      mediaItem={mediaItem}
      episode={episode}
      closeModal={closeDialog}
      onSelected={async ({ date }) => {
        const res = await addMutation.mutateAsync({
          mediaItemId: mediaItem.id,
          episodes: [
            {
              episodeId: episode.id,
              duration: episode.runtime || mediaItem.runtime,
              date:
                date === 'release_date'
                  ? episode.releaseDate
                    ? new Date(episode.releaseDate).getTime()
                    : null
                  : date?.getTime(),
            },
          ],
        });

        addPopup({
          content: (
            <Trans>
              Added{' '}
              <strong>
                {mediaItem.title + ' ' + formatEpisodeNumber(episode)}
              </strong>{' '}
              to seen history
            </Trans>
          ),
          action: () =>
            deleteMutation.mutateAsync(res.map(({ id }) => ({ seenId: id }))),
        });
      }}
    />
  );
});

const AddRegularMediaItemToSeenHistoryAction = dialogActionFactory<{
  mediaItem: MediaItemResponse;
}>((props) => {
  const { mediaItem, closeDialog } = props;
  const { addPopup } = useUndoPopup();

  const { invalidateMediaItem } = useInvalidateMediaItem(mediaItem);

  const addMutation = trpc.seen.markAsSeen.useMutation({
    onSuccess: () => {
      invalidateMediaItem();
      closeDialog();
    },
  });

  const deleteMutation = trpc.seen.deleteMany.useMutation({
    onSuccess: invalidateMediaItem,
  });

  const addToWatchlistMutation = trpc.watchlist.add.useMutation({
    onSuccess: invalidateMediaItem,
  });

  return (
    <SelectSeenDateComponent
      mediaItem={mediaItem}
      onSelected={async ({ date }) => {
        const res = await addMutation.mutateAsync({
          mediaItemId: mediaItem.id,
          duration: mediaItem.runtime,
          date:
            date === 'release_date'
              ? mediaItem.releaseDate
                ? new Date(mediaItem.releaseDate).getTime()
                : null
              : date?.getTime(),
        });

        addPopup({
          content: (
            <Trans>
              Added <strong>{mediaItem.title}</strong> to seen history
            </Trans>
          ),
          action: () => {
            deleteMutation.mutate([{ seenId: res }]);
            mediaItem.onWatchlist &&
              addToWatchlistMutation.mutate({
                mediaItemId: mediaItem.id,
                seasonId: null,
                episodeId: null,
              });
          },
        });
      }}
      closeModal={closeDialog}
    />
  );
});

export const AddEpisodeOrMediaItemToSeenHistoryAction: FC<{
  mediaItem: MediaItemResponse;
  episode?: EpisodeResponse;
  children: React.JSX.Element;
}> = ({ mediaItem, episode, children }) => {
  if (episode) {
    return (
      <AddEpisodeToSeenHistoryAction mediaItem={mediaItem} episode={episode}>
        {children}
      </AddEpisodeToSeenHistoryAction>
    );
  } else if (mediaItem.mediaType === 'tv') {
    return (
      <AddTvShowToSeenHistoryAction mediaItem={mediaItem}>
        {children}
      </AddTvShowToSeenHistoryAction>
    );
  } else {
    return (
      <AddRegularMediaItemToSeenHistoryAction mediaItem={mediaItem}>
        {children}
      </AddRegularMediaItemToSeenHistoryAction>
    );
  }
};

export const RemoveFromWatchlistAction: FC<{
  mediaItem: MediaItemResponse;
  children: React.JSX.Element;
}> = ({ mediaItem, children }) => {
  const { addPopup } = useUndoPopup();
  const { invalidateMediaItem, overrideSearchResponses } =
    useInvalidateMediaItem(mediaItem);

  const addToWatchlistMutation = trpc.watchlist.add.useMutation({
    onSuccess: () => {
      overrideSearchResponses.addedToWatchlist(mediaItem);
      invalidateMediaItem();
    },
  });

  const removeFromWatchlistMutation = trpc.watchlist.delete.useMutation({
    onSuccess: () => {
      overrideSearchResponses.removedFromWatchlist(mediaItem);
      invalidateMediaItem();

      addPopup({
        content: (
          <Trans>
            <strong>{mediaItem.title}</strong> has been removed from watchlist
          </Trans>
        ),
        action: () =>
          addToWatchlistMutation.mutateAsync({
            mediaItemId: mediaItem.id,
            seasonId: null,
            episodeId: null,
          }),
      });
    },
  });

  return React.cloneElement(children, {
    onClick: () => {
      removeFromWatchlistMutation.mutate({
        mediaItemId: mediaItem.id,
        seasonId: null,
        episodeId: null,
      });
    },
  });
};

export const AddToWatchlistAction: FC<{
  mediaItem: MediaItemResponse;
  children: React.JSX.Element;
}> = ({ mediaItem, children }) => {
  const { addPopup } = useUndoPopup();
  const { invalidateMediaItem, overrideSearchResponses } =
    useInvalidateMediaItem(mediaItem);

  const updateMetadataMutation = trpc.mediaItem.updateMetadata.useMutation({
    onSuccess: () => invalidateMediaItem(),
  });
  const removeFromWatchlistMutation = trpc.watchlist.delete.useMutation({
    onSuccess: () => {
      overrideSearchResponses.removedFromWatchlist(mediaItem);
      invalidateMediaItem();
    },
  });

  const addToWatchlistMutation = trpc.watchlist.add.useMutation({
    onSuccess: () => {
      overrideSearchResponses.addedToWatchlist(mediaItem);
      invalidateMediaItem();

      addPopup({
        content: (
          <Trans>
            <strong>{mediaItem.title}</strong> has been added to watchlist
          </Trans>
        ),
        action: () =>
          removeFromWatchlistMutation.mutateAsync({
            mediaItemId: mediaItem.id,
            seasonId: null,
            episodeId: null,
          }),
      });

      if (mediaItem.needsDetails) {
        updateMetadataMutation.mutate({ mediaItemId: mediaItem.id });
      }
    },
  });

  return React.cloneElement(children, {
    onClick: () => {
      addToWatchlistMutation.mutate({
        mediaItemId: mediaItem.id,
        episodeId: null,
        seasonId: null,
      });
    },
  });
};

export const AddTvShowToSeenHistoryAction = dialogActionFactory<{
  mediaItem: MediaItemResponse;
}>((props) => {
  const { mediaItem, closeDialog } = props;
  const mediaItemId = mediaItem.id;

  if (mediaItem.mediaType !== 'tv') {
    throw new Error(`This modal can only be used with mediaType "tv"`);
  }

  const details = trpc.mediaItem.details.useQuery({
    mediaItemId: mediaItemId,
  });

  const { invalidateMediaItem } = useInvalidateMediaItem(mediaItem);

  const addMutation = trpc.seen.markEpisodesAsSeen.useMutation({
    onSuccess: invalidateMediaItem,
  });

  const deleteMutation = trpc.seen.deleteMany.useMutation({
    onSuccess: invalidateMediaItem,
  });

  const [selectedEpisodeId, setSelectedEpisodeId] = useState<number>();

  const selectedEpisode = details.data?.seasons
    ?.flatMap((season) => season.episodes)
    ?.find((episode) => episode?.id === selectedEpisodeId);

  const episodesToMarkAsSeen = selectedEpisode
    ? details.data?.seasons
        ?.filter((season) => !season.isSpecialSeason)
        .flatMap((season) => season.episodes || [])
        ?.filter(hasBeenReleased)
        ?.filter(
          (episode) =>
            episode.seasonNumber < selectedEpisode.seasonNumber ||
            (episode.seasonNumber === selectedEpisode.seasonNumber &&
              episode.episodeNumber <= selectedEpisode.episodeNumber)
        )
    : [];

  const { addPopup } = useUndoPopup();

  return (
    <div>
      <div className="flex flex-col">
        {details.data && (
          <>
            <div className="text-xl font-bold text-center">
              <Trans>
                What is the last episode of{' '}
                <span className="text-pink-600">{details.data.title}</span> you
                see?
              </Trans>
            </div>
            <div className="flex flex-col mt-6 text-start">
              <EpisodeSelector
                mediaItem={details.data}
                selectedEpisodeId={selectedEpisodeId}
                setSelectedEpisodeId={setSelectedEpisodeId}
              />

              <div className="my-2 italic text-slate-600">
                {episodesToMarkAsSeen && (
                  <>
                    <Plural
                      value={episodesToMarkAsSeen.length}
                      one="1 episode will be added to seen history"
                      other="# episodes will be added to seen history"
                    />
                  </>
                )}
              </div>

              <div className="flex flex-row justify-between mt-4">
                <DialogAction
                  dialogContent={(closeInnerDialog) => (
                    <>
                      {details.data && episodesToMarkAsSeen && (
                        <SelectSeenDateComponent
                          mediaItem={details.data}
                          onSelected={async ({ date }) => {
                            const res = await addMutation.mutateAsync({
                              mediaItemId: mediaItemId,
                              episodes:
                                episodesToMarkAsSeen.map((episode) => ({
                                  episodeId: episode.id,
                                  duration:
                                    episode.runtime || details.data.runtime,
                                  date:
                                    date === 'release_date'
                                      ? episode.releaseDate
                                        ? new Date(
                                            episode.releaseDate
                                          ).getTime()
                                        : null
                                      : date?.getTime(),
                                })) || [],
                            });

                            addPopup({
                              content: (
                                <Plural
                                  value={episodesToMarkAsSeen.length}
                                  one={
                                    <Trans>
                                      Added 1 episode of{' '}
                                      <strong>{details.data.title}</strong> to
                                      seen history
                                    </Trans>
                                  }
                                  other={
                                    <Trans>
                                      Added # episodes of{' '}
                                      <strong>{details.data.title}</strong> to
                                      seen history
                                    </Trans>
                                  }
                                />
                              ),
                              action: () =>
                                deleteMutation.mutateAsync(
                                  res.map(({ id }) => ({ seenId: id }))
                                ),
                            });

                            closeInnerDialog();
                            closeDialog();
                          }}
                          closeModal={() => {
                            closeInnerDialog();
                            closeDialog();
                          }}
                        />
                      )}
                    </>
                  )}
                >
                  <Button
                    text={<Trans>Select</Trans>}
                    isLoading={addMutation.isLoading}
                  />
                </DialogAction>

                <Button
                  type="secondary"
                  color="red"
                  text={<Trans>Cancel</Trans>}
                  onClick={closeDialog}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

export const AddSingleEpisodeToSeenHistoryAction = dialogActionFactory<{
  mediaItem: MediaItemResponse;
}>((props) => {
  const { mediaItem, closeDialog } = props;
  const mediaItemId = mediaItem.id;

  if (mediaItem.mediaType !== 'tv') {
    throw new Error(`This modal can only be used with mediaType "tv"`);
  }

  const details = trpc.mediaItem.details.useQuery({
    mediaItemId: mediaItemId,
  });

  const { invalidateMediaItem } = useInvalidateMediaItem(mediaItem);

  const addMutation = trpc.seen.markEpisodesAsSeen.useMutation({
    onSuccess: invalidateMediaItem,
  });

  const deleteMutation = trpc.seen.deleteMany.useMutation({
    onSuccess: invalidateMediaItem,
  });

  const [selectedEpisodeId, setSelectedEpisodeId] = useState<number>();

  const selectedEpisode = details.data?.seasons
    ?.flatMap((season) => season.episodes)
    ?.find((episode) => episode?.id === selectedEpisodeId);

  const { addPopup } = useUndoPopup();

  return (
    <div>
      <div className="flex flex-col">
        {details.data && (
          <>
            <div className="text-xl font-bold text-center">
              <Trans>
                Select episode of{' '}
                <span className="text-pink-600">{details.data.title}</span>
              </Trans>
            </div>
            <div className="flex flex-col mt-6 text-start">
              <EpisodeSelector
                mediaItem={details.data}
                selectedEpisodeId={selectedEpisodeId}
                setSelectedEpisodeId={setSelectedEpisodeId}
              />

              <div className="flex flex-row justify-between mt-4">
                <DialogAction
                  dialogContent={(closeInnerDialog) => (
                    <>
                      {details.data && selectedEpisode && (
                        <SelectSeenDateComponent
                          mediaItem={details.data}
                          episode={selectedEpisode}
                          onSelected={async ({ date }) => {
                            const res = await addMutation.mutateAsync({
                              mediaItemId: mediaItemId,
                              episodes: [
                                {
                                  episodeId: selectedEpisode.id,
                                  duration:
                                    selectedEpisode.runtime ||
                                    details.data.runtime,
                                  date:
                                    date === 'release_date'
                                      ? selectedEpisode.releaseDate
                                        ? new Date(
                                            selectedEpisode.releaseDate
                                          ).getTime()
                                        : null
                                      : date?.getTime(),
                                },
                              ],
                            });

                            addPopup({
                              content: (
                                <Trans>
                                  Added 1 episode of{' '}
                                  <strong>{details.data.title}</strong> to seen
                                  history
                                </Trans>
                              ),
                              action: () =>
                                deleteMutation.mutateAsync(
                                  res.map(({ id }) => ({ seenId: id }))
                                ),
                            });

                            closeInnerDialog();
                            closeDialog();
                          }}
                          closeModal={() => {
                            closeInnerDialog();
                            closeDialog();
                          }}
                        />
                      )}
                    </>
                  )}
                >
                  <Button
                    text={<Trans>Select</Trans>}
                    isLoading={addMutation.isLoading}
                  />
                </DialogAction>

                <Button
                  type="secondary"
                  color="red"
                  text={<Trans>Cancel</Trans>}
                  onClick={closeDialog}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

const EpisodeSelector: FC<{
  mediaItem: MediaItemResponse;
  selectedEpisodeId: number | undefined;
  setSelectedEpisodeId: (value: number | undefined) => void;
}> = (props) => {
  const { mediaItem, selectedEpisodeId, setSelectedEpisodeId } = props;

  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>();
  const selectedSeason = mediaItem.seasons?.find(
    (season) => season.id === selectedSeasonId
  );

  const seasons =
    mediaItem.seasons?.filter(
      (season) => (season.episodes?.filter(hasBeenReleased).length || 0) > 0
    ) || [];

  useEffect(() => {
    setSelectedSeasonId(seasons?.at(-1)?.id);

    const episodeId = seasons
      ?.at(-1)
      ?.episodes?.filter(hasBeenReleased)
      ?.at(-1)?.id;

    if (typeof episodeId === 'number') {
      setSelectedEpisodeId(episodeId);
    }
  }, []);

  return (
    <>
      {typeof selectedSeasonId === 'number' && (
        <>
          <label>
            <div className="inline mr-2">
              <Trans>Season: </Trans>
            </div>
            <select
              value={selectedSeasonId}
              onChange={(e) => {
                const newSeasonId = Number(e.target.value);

                setSelectedSeasonId(newSeasonId);
                setSelectedEpisodeId(
                  seasons
                    ?.find((season) => season.id === newSeasonId)
                    ?.episodes?.at(0)?.id || undefined
                );
              }}
            >
              {seasons
                ?.filter((season) => !season.isSpecialSeason)
                ?.filter((season) => !season.isSpecialSeason)
                ?.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.title}
                  </option>
                ))}
            </select>
          </label>

          <label className="mt-4">
            <div className="inline mr-2">
              <Trans>Episode: </Trans>
            </div>
            <select
              value={selectedEpisodeId}
              onChange={(e) => setSelectedEpisodeId(Number(e.target.value))}
            >
              {selectedSeason?.episodes
                ?.filter(hasBeenReleased)
                ?.map((episode) => (
                  <option key={episode.id} value={episode.id}>
                    {!episode.title.endsWith(` ${episode.episodeNumber}`) &&
                      episode.episodeNumber + '. '}

                    {episode.title}
                  </option>
                ))}
            </select>
          </label>
        </>
      )}
    </>
  );
};

export const DialogAction: FC<{
  children: React.JSX.Element;
  dialogContent: (closeDialog: () => void) => ReactNode;
}> = (props) => {
  const { children, dialogContent } = props;
  const [isOpen, setIsOpen] = useState(false);
  const closeDialog = () => setIsOpen(false);

  return (
    <>
      {React.cloneElement(children, {
        onClick: () => setIsOpen(true),
      })}

      <Dialog isOpen={isOpen} close={closeDialog}>
        <>{dialogContent(closeDialog)}</>
      </Dialog>
    </>
  );
};
