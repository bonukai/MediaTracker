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
            {isAudiobook(mediaItem) && (
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
              .map((seenEntry) => (
                <li key={seenEntry.id}>
                  {isAudiobook(mediaItem) &&
                    (seenEntry.date > 0 ? (
                      <Trans>
                        Listened at {new Date(seenEntry.date).toLocaleString()}
                      </Trans>
                    ) : (
                      <Trans>No date</Trans>
                    ))}

                  {isBook(mediaItem) &&
                    (seenEntry.date > 0 ? (
                      <Trans>
                        Read at {new Date(seenEntry.date).toLocaleString()}
                      </Trans>
                    ) : (
                      <Trans>No date</Trans>
                    ))}

                  {(isMovie(mediaItem) || isTvShow(mediaItem)) &&
                    (seenEntry.date > 0 ? (
                      <Trans>
                        Seen at {new Date(seenEntry.date).toLocaleString()}
                      </Trans>
                    ) : (
                      <Trans>No date</Trans>
                    ))}

                  {isVideoGame(mediaItem) &&
                    (seenEntry.date > 0 ? (
                      <Trans>
                        Played at {new Date(seenEntry.date).toLocaleString()}
                      </Trans>
                    ) : (
                      <Trans>No date</Trans>
                    ))}
                  <div>
                    {seenEntry.episodeId && episodesMap[seenEntry.episodeId] && (
                      <Trans>
                        Episode{' '}
                        {formatEpisodeNumber(episodesMap[seenEntry.episodeId])}{' '}
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
