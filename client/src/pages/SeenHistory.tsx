import React, { FunctionComponent, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Plural, Trans } from '@lingui/macro';

import { TvEpisode } from 'mediatracker-api';
import { useDetails } from 'src/api/details';
import {
  formatEpisodeNumber,
  isAudiobook,
  isBook,
  isMovie,
  isMusic,
  isTvShow,
  isVideoGame,
} from 'src/utils';
import { RemoveFromSeenHistoryButton } from 'src/components/AddAndRemoveFromSeenHistoryButton';

export const SeenHistoryPage: FunctionComponent = () => {
  const { mediaItemId } = useParams();
  const { mediaItem, isLoading, error } = useDetails(Number(mediaItemId));

  const episodesMap: Record<number, TvEpisode> = useMemo(
    () =>
      mediaItem?.seasons
        .flatMap((season) => season.episodes)
        .reduce((res, episode) => ({ ...res, [episode.id]: episode }), {}),
    [mediaItem]
  );

  if (isLoading) {
    return <Trans>Loading</Trans>;
  }

  if (error) {
    return <>{error}</>;
  }

  return (
    <>
      {mediaItem.seenHistory?.length > 0 && (
        <div className="mt-3">
          <div>
            {(isAudiobook(mediaItem) || isMusic(mediaItem)) && (
              <Plural
                value={mediaItem.seenHistory.length}
                one="Listened 1 time"
                other="Listened # times"
              />
            )}

            {isBook(mediaItem) && (
              <Plural
                value={mediaItem.seenHistory.length}
                one="Read 1 time"
                other="Read # times"
              />
            )}

            {(isMovie(mediaItem) || isTvShow(mediaItem)) && (
              <Plural
                value={mediaItem.seenHistory.length}
                one="Seen 1 time"
                other="Seen # times"
              />
            )}

            {isVideoGame(mediaItem) && (
              <Plural
                value={mediaItem.seenHistory.length}
                one="Played 1 time"
                other="Played # times"
              />
            )}
          </div>

          <ul className="list-disc">
            {mediaItem.seenHistory
              .sort((a, b) => b.date - a.date)
              .map((seenEntry) => ({
                ...seenEntry,
                dateStr: seenEntry.date
                  ? new Date(seenEntry.date).toLocaleString()
                  : null,
              }))
              .map((seenEntry) => (
                <li key={seenEntry.id}>
                  {seenEntry.date ? (
                    <>
                      {(isAudiobook(mediaItem) || isMusic(mediaItem)) && (
                        <Trans>Listened at {seenEntry.dateStr}</Trans>
                      )}

                      {isBook(mediaItem) && (
                        <Trans>Read at {seenEntry.dateStr}</Trans>
                      )}

                      {(isMovie(mediaItem) || isTvShow(mediaItem)) && (
                        <Trans>Seen at {seenEntry.dateStr}</Trans>
                      )}

                      {isVideoGame(mediaItem) && (
                        <Trans>Played at {seenEntry.dateStr}</Trans>
                      )}
                    </>
                  ) : (
                    <Trans>No date</Trans>
                  )}

                  <div>
                    {seenEntry.episodeId &&
                      episodesMap[seenEntry.episodeId] && (
                        <Trans>
                          Episode{' '}
                          {formatEpisodeNumber(
                            episodesMap[seenEntry.episodeId]
                          )}{' '}
                          {episodesMap[seenEntry.episodeId].title}
                        </Trans>
                      )}
                  </div>

                  <div className="mt-1 mb-3">
                    <RemoveFromSeenHistoryButton
                      mediaItem={mediaItem}
                      episode={
                        (seenEntry.episodeId &&
                          episodesMap[seenEntry.episodeId]) ||
                        undefined
                      }
                      seenId={seenEntry.id}
                    />
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}
    </>
  );
};
