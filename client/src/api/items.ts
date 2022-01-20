import { useQuery, useMutation } from 'react-query';

import { Items } from 'mediatracker-api';
import { mediaTrackerApi } from 'src/api/api';

export const useItems = (args: Items.Paginated.RequestQuery) => {
  const { error, data, isFetched } = useQuery(
    ['items', args],
    async () => mediaTrackerApi.items.paginated(args),
    {
      keepPreviousData: true,
    }
  );

  const search = useMutation((query: string) =>
    mediaTrackerApi.search.search({ mediaType: args.mediaType, q: query })
  );

  return {
    items: search.data ? search.data : data?.data,
    error: error,
    isLoading: !isFetched || search.isLoading,
    numberOfPages: data ? data.totalPages : undefined,
    numberOfItemsTotal: data ? data.total : undefined,
    search: search.mutate,
  };
};
