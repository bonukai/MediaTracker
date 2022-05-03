import { useQuery } from 'react-query';
import { mediaTrackerApi } from 'src/api/api';
import { queryClient } from 'src/App';

export const useList = (args: { listId: number }) => {
  const { listId } = args;

  const key = ['list', listId];

  const { data, isLoading, isError } = useQuery(key, () =>
    mediaTrackerApi.list.getList({ listId: listId })
  );

  return {
    list: data,
    isLoading,
    isError,
    invalidateListQuery: () => queryClient.invalidateQueries(key),
  };
};
