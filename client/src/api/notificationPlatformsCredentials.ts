import { useQuery, useMutation } from 'react-query';
import { queryClient } from 'src/App';

import { mediaTrackerApi } from 'src/api/api';

export const useNotificationPlatformsCredentials = () => {
  const { isLoading, error, data } = useQuery(
    'notificationPlatformsCredentials',
    () => mediaTrackerApi.user.getNotificationCredentials()
  );

  const setNotificationCredentialsMutation = useMutation(
    mediaTrackerApi.user.updateNotificationCredentials,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notificationPlatformsCredentials');
      },
    }
  );

  return {
    isLoading: isLoading,
    error: error,
    notificationPlatformsCredentials: data,
    setNotificationPlatformsCredentials:
      setNotificationCredentialsMutation.mutate,
  };
};
