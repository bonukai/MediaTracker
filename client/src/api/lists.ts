import { useQuery } from 'react-query';
import { mediaTrackerApi } from 'src/api/api';
import { queryClient } from 'src/App';

export const useLists = (args: {
  userId: number;
  mediaItemId?: number;
  seasonId?: number;
  episodeId?: number;
}) => {
  const { userId, mediaItemId, seasonId, episodeId } = args;

  const key = ['lists', userId, mediaItemId, seasonId, episodeId];

  const { data, isLoading, isError } = useQuery(key, () =>
    mediaTrackerApi.lists.getUsersLists({
      userId: userId,
      mediaItemId: mediaItemId,
      seasonId: seasonId,
      episodeId: episodeId,
    })
  );

  return {
    lists: data,
    isLoading,
    isError,
    invalidateListsQuery: () => {
      queryClient.invalidateQueries(key);
      queryClient.invalidateQueries(['details', mediaItemId]);
    },
  };
};
