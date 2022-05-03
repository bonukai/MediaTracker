import React, { FunctionComponent } from 'react';
import clsx from 'clsx';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import { Trans, t } from '@lingui/macro';

import { useUser } from 'src/api/user';
import { SettingsPasswordPage } from 'src/pages/settings/Password';
import { SettingsApplicationTokensPage } from 'src/pages/settings/ApplicationTokens';
import { SettingsNotificationsPage } from 'src/pages/settings/Notifications';
import { SettingsPreferencesPage } from 'src/pages/settings/Preferences';
import { SettingsConfigurationPage } from 'src/pages/settings/Configuration';
import { SettingsSegment } from 'src/components/SettingsSegment';
import { useConfiguration } from 'src/api/configuration';
import { LogsPage } from 'src/pages/LogsPage';
import { SettingsAboutPage } from 'src/pages/settings/About';

export const SettingsPage: FunctionComponent = () => {
  const { user } = useUser();
  const { configuration } = useConfiguration();

  return (
    <>
      <Routes>
        <Route element={<SettingsPageLayout />}>
          {!configuration.demo && (
            <Route path="password" element={<SettingsPasswordPage />} />
          )}
          <Route path="about" element={<SettingsAboutPage />} />

          <Route
            path="application-tokens"
            element={<SettingsApplicationTokensPage />}
          />
          <Route path="notifications" element={<SettingsNotificationsPage />} />
          <Route path="preferences" element={<SettingsPreferencesPage />} />

          {Boolean(user.admin) && (
            <>
              <Route
                path="configuration"
                element={<SettingsConfigurationPage />}
              />
              <Route path="logs" element={<LogsPage />} />
            </>
          )}

          <Route
            path="*"
            element={
              <Navigate
                to={!configuration.demo ? 'password' : 'application-tokens'}
                replace={true}
              />
            }
          />
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
          <div className="text-4xl">
            <Trans>Settings</Trans>
          </div>
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
  const { configuration } = useConfiguration();

  return [
    {
      path: 'about',
      name: t`About`,
    },
    ...(!configuration.demo
      ? [
          {
            path: 'password',
            name: t`Password`,
          },
        ]
      : []),
    {
      path: 'application-tokens',
      name: t`Application tokens`,
    },
    {
      path: 'notifications',
      name: t`Notifications`,
    },
    {
      path: 'preferences',
      name: t`Preferences`,
    },
    ...(user.admin
      ? [
          {
            path: 'configuration',
            name: t`Configuration`,
          },
          {
            path: 'logs',
            name: t`Logs`,
          },
        ]
      : []),
  ];
};
