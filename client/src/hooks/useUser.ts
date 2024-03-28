import { TRPCClientError } from '@trpc/client';
import { trpc } from '../utils/trpc';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useUser = () => {
  const [isLoading, setIsLoading] = useState(true);
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();

  const query = trpc.user.get.useQuery(undefined, {
    retry(_, error) {
      if (error instanceof TRPCClientError) {
        return false;
      }

      return true;
    },
    onSettled() {
      setIsLoading(false);
    },
  });

  const login = trpc.user.login.useMutation({
    onSuccess: () => {
      utils.user.invalidate();
    },
  });

  const register = trpc.user.register.useMutation({
    onSuccess: () => {
      utils.user.invalidate();
    },
  });

  const logout = trpc.user.logout.useMutation({
    onSuccess: () => {
      queryClient.removeQueries();
    },
  });

  const setPassword = trpc.user.changePassword.useMutation({
    onSuccess: () => {
      utils.user.invalidate();
    },
  });

  const changePassword = trpc.user.changePassword.useMutation();
  const updatePreferences = trpc.user.changePreferences.useMutation({
    onSuccess: () => {
      utils.user.invalidate();
    },
  });

  return {
    user: {
      data: query.data,
      isLoading,
    },
    login,
    register,
    logout,
    changePassword,
    setPassword,
    updatePreferences,
  };
};
