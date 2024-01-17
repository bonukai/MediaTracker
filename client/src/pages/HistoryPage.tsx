import { startOfDay } from 'date-fns';
import { FC } from 'react';

import { Trans } from '@lingui/macro';

import { Button } from '../components/Button';
import { DeleteIcon } from '../components/Icons';
import { LocaleDateComponent } from '../components/LocaleDateParts';
import { MainTitle } from '../components/MainTitle';
import { MediaTypePill } from '../components/MediaTypeIcon';
import { usePagination } from '../components/Pagination';
import { useUndoPopup } from '../hooks/useUndoPopup';
import { formatEpisodeNumber, isTvShow } from '../mediaItemHelpers';
import { cx } from '../utils';
import { trpc } from '../utils/trpc';
import {
  EpisodeResponse,
  MediaItemResponse,
} from '@server/entity/mediaItemModel';

export const HistoryPage: FC = () => {
  const { currentPageNumber, PaginationComponent } = usePagination();
  const seenHistoryQuery = trpc.seen.getSeenHistory.useQuery({
    page: currentPageNumber,
    numberOfItemsPerPage: 40,
  });

  return (
    <>
      <MainTitle>
        <Trans>History</Trans>
      </MainTitle>

      <>
        {seenHistoryQuery.data && (
          <HistoryComponent seenHistory={seenHistoryQuery.data.items} />
        )}

        <PaginationComponent
          numberOfPages={seenHistoryQuery.data?.totalNumberOfPages}
        />
      </>
    </>
  );
};

export const HistoryComponent: FC<{
  seenHistory: {
    seenId: number;
    duration: number | null;
    seenAt: number | null;
    mediaItem: MediaItemResponse;
    episode: EpisodeResponse | null;
  }[];
}> = (props) => {
  const { seenHistory } = props;

  const { addPopup } = useUndoPopup();

  const utils = trpc.useUtils();

  const onSuccess = () => {
    utils.seen.invalidate();
    utils.mediaItem.invalidate();
    utils.homeSection.invalidate();
    utils.list.invalidate();
    utils.progress.invalidate();
  };

  const groupedByDay = [
    ...(seenHistory
      .reduce((res, current) => {
        const key = current.seenAt
          ? startOfDay(new Date(current.seenAt)).getTime()
          : null;

        return res.set(key, [current, ...(res.get(key) || [])]);
      }, new Map<number | null, typeof seenHistory>())
      .entries() || []),
  ];

  const deleteMutation = trpc.seen.delete.useMutation({ onSuccess });
  const markAsSeenMutation = trpc.seen.markAsSeen.useMutation({ onSuccess });
  const markEpisodesAsSeenMutation = trpc.seen.markEpisodesAsSeen.useMutation({
    onSuccess,
  });

  return (
    <>
      {groupedByDay.map(([day, items]) => (
        <div key={day || 'missing date'}>
          <div className="flex items-center gap-2 my-2">
            <div className="w-2 rounded-full aspect-square bg-sky-500"></div>
            <div className="font-semibold text-slate-800">
              {day ? (
                <LocaleDateComponent
                  date={new Date(day)}
                  options={{ dateStyle: 'full' }}
                />
              ) : (
                <Trans>No date available</Trans>
              )}
            </div>
          </div>
          <div className="ml-4 ">
            <table>
              <tbody>
                {items.map((item, index) => (
                  <tr
                    key={item.seenId}
                    className={cx(
                      ' border-slate-300',
                      index + 1 < items.length && 'border-b-[1px]'
                    )}
                  >
                    <td className="px-4 py-2">
                      <MediaTypePill mediaItem={item.mediaItem} />
                    </td>
                    <td className="px-4 py-2">
                      {isTvShow(item.mediaItem) && item.episode ? (
                        <div>
                          {item.mediaItem.title}{' '}
                          {formatEpisodeNumber(item.episode)}
                        </div>
                      ) : (
                        <div>{item.mediaItem.title}</div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {item.seenAt && (
                        <> {new Date(item.seenAt).toLocaleTimeString()}</>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <Button
                        type="secondary"
                        preventDefault
                        onClick={async () => {
                          await deleteMutation.mutateAsync({
                            seenId: item.seenId,
                          });

                          addPopup({
                            action: () => {
                              if (item.episode) {
                                markEpisodesAsSeenMutation.mutateAsync({
                                  mediaItemId: item.mediaItem.id,
                                  episodes: [
                                    {
                                      episodeId: item.episode.id,
                                      date: item.seenAt,
                                      duration: item.duration,
                                    },
                                  ],
                                });
                              } else {
                                markAsSeenMutation.mutate({
                                  mediaItemId: item.mediaItem.id,
                                  date: item.seenAt,
                                  duration: item.duration,
                                });
                              }
                            },
                            content: (
                              <Trans>
                                {item.mediaItem.title} has been removed from
                                seen history
                              </Trans>
                            ),
                          });
                        }}
                        icon={<DeleteIcon />}
                        text={<Trans>Delete seen entry</Trans>}
                        color="red"
                        isLoading={
                          deleteMutation.variables?.seenId === item.seenId &&
                          deleteMutation.isLoading
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </>
  );
};
