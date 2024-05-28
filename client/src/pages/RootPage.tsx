import { FC, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';

import { useUser } from '../hooks/useUser';
import { trpc } from '../utils/trpc';

import type { ConfigurationJson } from '@server/entity/configurationModel';
import type { UserResponse } from '@server/entity/userModel';

export const RootPage: FC = () => {
  const { i18n } = useLingui();
  const { user } = useUser();
  const isAdmin = user.data?.admin === true;
  const configuration = trpc.configuration.get.useQuery(undefined, {
    enabled: isAdmin,
  });
  const location = useLocation();

  const userLocale = user.data?.preferences.language;

  useEffect(() => {
    if (userLocale) {
      i18n.activate(userLocale);
    }
  }, [userLocale]);

  if (user.isLoading || (isAdmin ? configuration.isLoading : false)) {
    return <Trans>Loading</Trans>;
  }

  if (!user.data) {
    return <Navigate to="/login" />;
  }

  if (
    location.pathname !== '/settings/server-configuration' &&
    isLoggedIn(user.data) &&
    isAdmin &&
    !hasConfigurationBeenSet(configuration.data)
  ) {
    return <Navigate to="/settings/server-configuration" />;
  }

  return <Outlet />;
};

const hasConfigurationBeenSet = (
  configuration?: ConfigurationJson
): boolean => {
  return (
    typeof configuration?.publicAddress === 'string' &&
    typeof configuration?.justWatchCountryCode === 'string'
  );
};

const isLoggedIn = (user?: UserResponse): boolean => {
  return Boolean(user);
};
