import type { MediaItemResponse } from '@server/entity/mediaItemModel';
import { useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';

import { trpc } from '../utils/trpc';

export const useInvalidateMediaItem = (mediaItem: MediaItemResponse) => {
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();

  const overrideSearchData = (
    mediaItem: MediaItemResponse,
    fn: (item: MediaItemResponse) => MediaItemResponse
  ) => {
    queryClient
      .getQueriesData({
        queryKey: getQueryKey(trpc.search.search),
      })
      .forEach(([key]) => {
        queryClient.setQueryData<MediaItemResponse[]>(key, (items) =>
          items
            ? [
                ...items.map((item) =>
                  item.id === mediaItem.id ? fn(item) : { ...item }
                ),
              ]
            : undefined
        );
      });
  };

  const invalidateMediaItem = () => {
    utils.mediaItem.details.invalidate({ mediaItemId: mediaItem.id });
    utils.mediaItem.unrated.invalidate();
    utils.search.invalidate();
    utils.watchlist.get.invalidate();
    utils.list.invalidate();
    utils.homeSection.homePageItems.invalidate();
  };

  const overrideSearchResponses = {
    addedToWatchlist: (mediaItem: MediaItemResponse) => {
      overrideSearchData(mediaItem, (item) => ({ ...item, onWatchlist: true }));
    },
    removedFromWatchlist: (mediaItem: MediaItemResponse) => {
      overrideSearchData(mediaItem, (item) => ({
        ...item,
        onWatchlist: false,
      }));
    },
    setUserRating: (
      mediaItem: MediaItemResponse,
      userRating: {
        date: number | null;
        rating: number | null;
        review: string | null;
      }
    ) => {
      overrideSearchData(mediaItem, (item) => ({
        ...item,
        userRating: userRating,
      }));
    },
  } as const;

  return {
    invalidateMediaItem,
    overrideSearchResponses,
  };
};
