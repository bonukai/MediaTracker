import React, { FunctionComponent, useEffect } from 'react';
import clsx from 'clsx';
import {
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { NavLink } from 'react-router-dom';

import { useUser } from 'src/api/user';
import { SettingsPasswordPage } from 'src/pages/settings/Password';
import { SettingsApplicationTokensPage } from 'src/pages/settings/ApplicationTokens';
import { SettingsNotificationsPage } from 'src/pages/settings/Notifications';
import { SettingsPreferencesPage } from 'src/pages/settings/Preferences';
import { SettingsConfigurationPage } from 'src/pages/settings/Configuration';
import { SettingsMetadataProviderCredentialsPage } from 'src/pages/settings/MetadataProviderCredentials';
import { SettingsSegment } from 'src/components/SettingsSegment';

export const SettingsPage: FunctionComponent = () => {
  const { user } = useUser();

  const navigate = useNavigate();

  useEffect(
    () =>
      navigate(user.name !== 'demo' ? 'password' : 'application-tokens', {
        replace: true,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <>
      <Routes>
        <Route element={<SettingsPageLayout />}>
          {user.name !== 'demo' && (
            <Route path="password" element={<SettingsPasswordPage />} />
          )}
          <Route
            path="application-tokens"
            element={<SettingsApplicationTokensPage />}
          />
          <Route path="notifications" element={<SettingsNotificationsPage />} />
          <Route path="preferences" element={<SettingsPreferencesPage />} />

          {Boolean(user.admin) && (
            <>
              <Route
                path="metadata-providers-credentials"
                element={<SettingsMetadataProviderCredentialsPage />}
              />
              <Route
                path="configuration"
                element={<SettingsConfigurationPage />}
              />
            </>
          )}
        </Route>
      </Routes>
    </>
  );
};

const SettingsPageLayout: FunctionComponent = () => {
  const routeTitles = useRoutesTitle();
  const location = useLocation();

  const route = routeTitles.find(
    (route) => route.path === location.pathname.split('/').at(-1)
  );

  return (
    <>
      {route ? (
        <>
          <div className="text-4xl">Settings</div>
          <div className="flex flex-col mt-2 sm:flex-row">
            <div className="flex flex-col px-3 border rounded sm:shrink-0 max-w-fit h-fit">
              {routeTitles.map(({ path, name }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) =>
                    clsx('my-2 cursor-pointer text', isActive && 'underline ')
                  }
                >
                  {name}
                </NavLink>
              ))}
            </div>
            <div className="w-full mt-3 sm:ml-4 sm:mt-0">
              <SettingsSegment title={route.name}>
                <Outlet />
              </SettingsSegment>
            </div>
          </div>
        </>
      ) : (
        <Outlet />
      )}
    </>
  );
};

const useRoutesTitle = () => {
  const { user } = useUser();

  return [
    ...(user.name !== 'demo' ? [{ path: 'password', name: 'Password' }] : []),
    { path: 'application-tokens', name: 'Application tokens' },
    { path: 'notifications', name: 'Notifications' },
    { path: 'preferences', name: 'Preferences' },
    ...(user.admin
      ? [
          { path: 'configuration', name: 'Configuration' },
          {
            path: 'metadata-providers-credentials',
            name: 'Metadata providers credentials',
          },
        ]
      : []),
  ];
};
