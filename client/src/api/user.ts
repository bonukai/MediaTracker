import { useQuery, useMutation } from 'react-query';
import { queryClient } from 'src/App';
import { errorHandler, mediaTrackerApi } from 'src/api/api';
import React from 'react';

export const useOtherUser = (userId: number) => {
  const { isLoading, error, data } = useQuery(['user', userId], () =>
    mediaTrackerApi.user.getById(userId)
  );

  return {
    isLoading: isLoading,
    error: error,
    user: data,
  };
};

export const useUser = () => {
  const { isLoading, error, data } = useQuery('user', mediaTrackerApi.user.get);

  const logoutMutation = useMutation(() => mediaTrackerApi.user.logout(), {
    onSuccess: () => {
      queryClient.setQueryData('user', null);
      queryClient.removeQueries();
    },
  });

  const loginMutation = useMutation(mediaTrackerApi.user.login, {
    onSuccess: () => {
      queryClient.invalidateQueries('user');
    },
  });

  const updateUserMutation = useMutation(mediaTrackerApi.user.update, {
    onSuccess: () => {
      queryClient.invalidateQueries('user');
    },
  });

  const updatePasswordMutation = useMutation(
    mediaTrackerApi.user.updatePassword,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('user');
      },
    }
  );

  return {
    isLoading: isLoading,
    error: error,
    user: data,
    updateUser: updateUserMutation.mutateAsync,
    updatePassword: updatePasswordMutation.mutateAsync,
    loginIsError: loginMutation.isError,
    loginIsLoading: loginMutation.isLoading,
    login: loginMutation.mutate,
    loginError: loginMutation.error,
    logout: logoutMutation.mutate,
  };
};

export const useRegisterUser = () => {
  const [error, setError] = React.useState<string>();

  const mutation = useMutation(errorHandler(mediaTrackerApi.user.register), {
    onSuccess: (data) => {
      if (data.data) {
        queryClient.invalidateQueries('configuration');
        queryClient.invalidateQueries('user');
      }
    },
    onSettled: (data) => {
      if (data.error) {
        setError(data.error);
      } else {
        setError(undefined);
      }
    },
  });

  return {
    registerUser: mutation.mutate,
    error: error,
  };
};
