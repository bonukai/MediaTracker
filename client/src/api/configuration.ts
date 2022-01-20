import { useQuery, useMutation } from 'react-query';
import { queryClient } from 'src/App';

import { mediaTrackerApi } from 'src/api/api';

export const useConfiguration = () => {
  const { isLoading, error, data } = useQuery('configuration', () =>
    mediaTrackerApi.configuration.get()
  );

  const updateMutation = useMutation(mediaTrackerApi.configuration.update, {
    onSuccess: () => {
      queryClient.invalidateQueries('configuration');
    },
  });

  return {
    isLoading: isLoading,
    error: error,
    configuration: data,
    update: updateMutation.mutate,
  };
};
