import { useQuery, useMutation } from 'react-query';
import { queryClient } from 'src/App';

import { mediaTrackerApi } from 'src/api/api';

export const useMetadataProviderCredentials = () => {
  const { isLoading, error, data } = useQuery(
    'metadataProviderCredentials',
    () => mediaTrackerApi.metadataProviderCredentials.get()
  );

  const setMutation = useMutation(
    mediaTrackerApi.metadataProviderCredentials.set,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('metadataProviderCredentials');
      },
    }
  );

  return {
    isLoading: isLoading,
    error: error,
    metadataProviderCredentials: data,
    setMetadataProviderCredentials: setMutation.mutate,
  };
};
