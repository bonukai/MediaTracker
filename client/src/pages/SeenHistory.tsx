import React, { FunctionComponent, useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { TvEpisode } from 'mediatracker-api';
import { useDetails } from 'src/api/details';
import { formatEpisodeNumber } from 'src/utils';
import { useTranslation } from 'react-i18next';

export const SeenHistoryPage: FunctionComponent = () => {
  const { mediaItemId } = useParams();
  const { mediaItem, isLoading, error } = useDetails(Number(mediaItemId));
  const { t } = useTranslation();

  const episodesMap: Record<number, TvEpisode> = useMemo(
    () =>
      mediaItem?.seasons
        .flatMap((season) => season.episodes)
        .reduce((res, episode) => ({ ...res, [episode.id]: episode }), {}),
    [mediaItem]
  );

  if (isLoading) {
    return <>{t('Loading')}</>;
  }

  if (error) {
    return <>{error}</>;
  }

  return (
    <>
      {mediaItem.seenHistory?.length > 0 && (
        <div className="mt-3">
          <div>
            {t('Seen {{ count }} times', {
              count: mediaItem.seenHistory.length,
              defaultValue_one: 'Seen 1 time',
            })}
          </div>

          <ul className="list-disc">
            {mediaItem.seenHistory
              .sort((a, b) => b.date - a.date)
              .map((seenEntry) => (
                <li key={seenEntry.id}>
                  {seenEntry.date > 0 ? (
                    <>
                      {t('Seen at {{ date }}', {
                        date: new Date(seenEntry.date).toLocaleString(),
                      })}
                    </>
                  ) : (
                    <>{t('No date')}</>
                  )}
                  <div>
                    {seenEntry.seasonId &&
                      seenEntry.episodeId &&
                      episodesMap[seenEntry.episodeId] && (
                        <>
                          {t('Episode {{ episodeNumber }} {{ episodeTitle }}', {
                            episodeNumber: formatEpisodeNumber(
                              episodesMap[seenEntry.episodeId]
                            ),
                            episodeTitle:
                              episodesMap[seenEntry.episodeId].title,
                          })}
                        </>
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
