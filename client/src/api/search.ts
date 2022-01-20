import { useQuery } from 'react-query';
import { useState } from 'react';
import { MediaType, SortOrder } from 'mediatracker-api';
import { mediaTrackerApi } from 'src/api/api';

export const useItemsKey = (
  mediaType: MediaType,
  orderBy: string,
  sortOrder: SortOrder,
  filter: string,
  page: number
) => ['items', mediaType, orderBy, sortOrder, filter, page];

export const useSearch = () => {
  const [query, setQuery] =
    useState<{ mediaType: MediaType; query: string }>(null);

  const { isLoading, error, data } = useQuery(
    ['search', query],
    () =>
      mediaTrackerApi.search.search({
        mediaType: query.mediaType,
        q: query.query,
      }),
    {
      enabled: query !== null,
    }
  );

  return {
    items: data,
    error: error,
    isLoading: isLoading,
    search: (args: { mediaType: MediaType; query: string }) => {
      setQuery(args);
    },
  };
};
