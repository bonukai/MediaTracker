import { useQuery } from 'react-query';
import { queryClient } from 'src/App';
import {
  MediaItemItemsResponse,
  TvEpisode,
  LastSeenAt,
  Items,
} from 'mediatracker-api';

import { TvSeason } from 'mediatracker-api';
import { mediaTrackerApi } from 'src/api/api';

export const detailsKey = (mediaItemId: number) => ['details', mediaItemId];

const getDetails = async (mediaItemId: number) => {
  return mediaTrackerApi.details.get(mediaItemId);
};

export const useDetails = (mediaItemId: number) => {
  const { isLoading, error, data } = useQuery(detailsKey(mediaItemId), () =>
    getDetails(mediaItemId)
  );

  return {
    isLoading: isLoading,
    error: error,
    mediaItem: data,
  };
};

const updateMediaItem = async (mediaItem: MediaItemItemsResponse) => {
  const key = detailsKey(mediaItem.id);
  await queryClient.invalidateQueries(key, { refetchInactive: true });

  const updatedMediaItem =
    queryClient.getQueryData<MediaItemItemsResponse>(key) ||
    (await getDetails(mediaItem.id));

  const updater = (item: MediaItemItemsResponse) => {
    return item.id === updatedMediaItem?.id ? updatedMediaItem : item;
  };

  queryClient.setQueriesData(
    ['items'],
    (items: Items.Paginated.ResponseBody) => {
      return {
        ...items,
        data: items?.data?.map(updater),
      };
    }
  );

  queryClient.setQueriesData(['search'], (data: MediaItemItemsResponse[]) => {
    return data?.map(updater);
  });
};

export const setRating = async (
  options: {
    rating?: number;
    review?: string;
  } & (
    | { mediaItem: MediaItemItemsResponse }
    | { mediaItem: MediaItemItemsResponse; season: TvSeason }
    | { mediaItem: MediaItemItemsResponse; episode: TvEpisode }
  )
) => {
  const { mediaItem, season, episode } = {
    season: undefined,
    episode: undefined,
    ...options,
  };

  await mediaTrackerApi.rating.add({
    mediaItemId: mediaItem.id,
    seasonId: season?.id,
    episodeId: episode?.id,
    rating: options.rating,
    review: options.review,
  });

  await updateMediaItem(mediaItem);
};

export const removeFromWatchlist = async (
  mediaItem: MediaItemItemsResponse
) => {
  await mediaTrackerApi.watchlist.delete({ mediaItemId: mediaItem.id });
  await updateMediaItem(mediaItem);
  queryClient.invalidateQueries(['items']);
};

export const addToWatchlist = async (mediaItem: MediaItemItemsResponse) => {
  await mediaTrackerApi.watchlist.add({ mediaItemId: mediaItem.id });
  await updateMediaItem(mediaItem);
  queryClient.invalidateQueries(['items']);
};

export const markAsSeen = async (args: {
  mediaItem: MediaItemItemsResponse;
  season?: TvSeason;
  episode?: TvEpisode;
  seenAt?: LastSeenAt;
  date?: Date;
}) => {
  await mediaTrackerApi.seen.add({
    mediaItemId: args.mediaItem.id,
    seasonId: args.season?.id,
    episodeId: args.episode?.id,
    lastSeenAt: args.seenAt,
    date: args.date?.getTime(),
  });

  await updateMediaItem(args.mediaItem);
  queryClient.invalidateQueries(['items']);
};

export const setLastSeenEpisode = async (args: {
  mediaItem: MediaItemItemsResponse;
  episode: TvEpisode;
  season?: TvSeason;
  lastSeenAt: LastSeenAt;
  date?: Date;
}) => {
  await mediaTrackerApi.seen.add({
    mediaItemId: args.mediaItem.id,
    lastSeenEpisodeId: args.episode?.id,
    lastSeenAt: args.lastSeenAt,
    seasonId: args.season?.id,
    date: args.date?.getTime(),
  });

  await updateMediaItem(args.mediaItem);
  queryClient.invalidateQueries(['items']);
};

export const markAsUnseen = async (args: {
  mediaItem: MediaItemItemsResponse;
  season?: TvSeason;
  episode?: TvEpisode;
}) => {
  await mediaTrackerApi.seen.delete({
    mediaItemId: args.mediaItem.id,
    seasonId: args.season?.id,
    episodeId: args.episode?.id,
  });

  await updateMediaItem(args.mediaItem);
  queryClient.invalidateQueries(['items']);
};

export const removeFromSeenHistory = async (
  mediaItem: MediaItemItemsResponse
) => {
  await mediaTrackerApi.seen.delete({
    mediaItemId: mediaItem.id,
  });
  await updateMediaItem(mediaItem);
  queryClient.invalidateQueries(['items']);
};
