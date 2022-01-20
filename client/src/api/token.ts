import { useQuery, useMutation } from 'react-query';
import { queryClient } from 'src/App';

import { mediaTrackerApi } from 'src/api/api';

export const useTokens = () => {
  const { isLoading, error, data } = useQuery('tokens', () =>
    mediaTrackerApi.tokens.get()
  );

  const addTokenMutation = useMutation(mediaTrackerApi.tokens.add, {
    onSuccess: () => {
      queryClient.invalidateQueries('tokens');
    },
  });

  const removeTokenMutation = useMutation(mediaTrackerApi.tokens.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('tokens');
    },
  });

  return {
    isLoading: isLoading,
    error: error,
    tokens: data,
    addToken: addTokenMutation.mutateAsync,
    removeToken: removeTokenMutation.mutateAsync,
  };
};
