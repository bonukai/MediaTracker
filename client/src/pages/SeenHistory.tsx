import React, { FunctionComponent, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Plural, Trans } from '@lingui/macro';

import { TvEpisode } from 'mediatracker-api';
import { useDetails } from 'src/api/details';
import { formatEpisodeNumber } from 'src/utils';

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
            <Plural
              value={mediaItem.seenHistory.length}
              one="Seen 1 time"
              other="Seen # times"
            />
          </div>

          <ul className="list-disc">
            {mediaItem.seenHistory
              .sort((a, b) => b.date - a.date)
              .map((seenEntry) => (
                <li key={seenEntry.id}>
                  {seenEntry.date > 0 ? (
                    <Trans>
                      Seen at {new Date(seenEntry.date).toLocaleString()}
                    </Trans>
                  ) : (
                    <Trans>No date</Trans>
                  )}
                  <div>
                    {seenEntry.episodeId && episodesMap[seenEntry.episodeId] && (
                      <Trans>
                        Episode{' '}
                        {formatEpisodeNumber(episodesMap[seenEntry.episodeId])}{' '}
                        {episodesMap[seenEntry.episodeId].title}
                      </Trans>
                    )}
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}
    </>
  );
};
