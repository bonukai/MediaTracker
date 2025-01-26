import React from 'react';
import { createBrowserRouter, Params, useParams } from 'react-router-dom';

import { Layout } from './components/Layout';
import { CalendarPage } from './pages/CalendarPage';
import { DetailsPage } from './pages/DetailsPage';
import { ExportPage } from './pages/ExportPage';
import { HistoryPage } from './pages/HistoryPage';
import { HomePage } from './pages/HomePage';
import { ImportFormMediaTrackerPage } from './pages/import/ImportFormMediaTrackerPage';
import { ImportFromFloxPage } from './pages/import/ImportFromFloxPage';
import { ImportFromGoodreadsPage } from './pages/import/ImportFromGoodreadsPage';
import { ImportFromSimklPage } from './pages/import/ImportFromSimklPage';
import { ImportFromTraktPage } from './pages/import/ImportFromTraktPage';
import { ImportFromCsvPage } from './pages/import/ImportFromCsvPage';
import { ImportPage } from './pages/ImportPage';
import { JellyfinIntegrationPage } from './pages/integrations/JellyfinIntegrationPage';
import { KodiIntegrationPage } from './pages/integrations/KodiIntegrationPage';
import { PLexIntegrationsPage } from './pages/integrations/PlexIntegrationPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { ListItemsPage } from './pages/ListItemsPage';
import { ListsPage } from './pages/ListsPage';
import { LoginPage } from './pages/LoginPage';
import { ProgressPage } from './pages/ProgressPage';
import { RegisterPage } from './pages/RegisterPage';
import { RootPage } from './pages/RootPage';
import { SearchPage } from './pages/SearchPage';
import { ApplicationTokens } from './pages/settings/ApplicationTokens';
import { ServerConfigurationPage } from './pages/settings/ServerConfigurationPage';
import { HomePageSettingsPage } from './pages/settings/HomePageSettingsPage';
import { LogPage, LogsPage } from './pages/settings/LogsPage';
import { NotificationPlatformsSettingsPage } from './pages/settings/NotificationPlatformsSettingsPage';
import { PasswordSettingsPage } from './pages/settings/PasswordSettingsPage';
import { PreferencesSettingsPage } from './pages/settings/PreferencesSettingsPage';
import { UnratedPage } from './pages/UnratedPage';
import { UpcomingPage } from './pages/UpcomingPage';
import { trpc } from './utils/trpc';
import { Trans } from '@lingui/macro';
import { Img, Poster } from './components/Poster';
import { ImportFormRyotPage } from './pages/import/ImportFormRyot.tsx';

const elementWithParamsFactory = (
  fn: (params: Readonly<Params<string>>) => React.JSX.Element
) => {
  return React.createElement(() => {
    const params = useParams();
    return fn(params);
  });
};

const TestPage = () => {
  const details = trpc.mediaItem.details.useQuery({
    mediaItemId: 7528,
  });

  if (details.isLoading) {
    return <Trans>Loading</Trans>;
  }

  return (
    <div className="flex gap-3">
      <div className="w-80">
        <Poster mediaItem={details.data} width={640} />
      </div>
      <div className="w-80">
        <Img
          alt="poster"
          aspectRatio="2/3"
          src="/api/v1/img/get?id=c8ea90e8481a78091fe48406aea535a2&width=640"
        />
      </div>
      <div className="w-80">
        <Img
          alt="poster"
          aspectRatio="2/3"
          src="/api/v1/img/get?id=13213&width=640"
        />
      </div>
    </div>
  );
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },

  {
    element: <RootPage />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            path: '/test',
            element: <TestPage />,
          },
          {
            path: '/',
            element: <HomePage />,
          },
          {
            path: '/upcoming',
            element: <UpcomingPage />,
          },
          {
            path: '/calendar',
            element: <CalendarPage />,
          },
          {
            path: '/history',
            element: <HistoryPage />,
          },
          {
            path: '/progress',
            element: <ProgressPage />,
          },
          {
            path: '/lists',
            element: <ListsPage />,
          },
          {
            path: '/unrated',
            element: <UnratedPage />,
          },
          {
            path: '/export',
            element: <ExportPage />,
          },
          {
            path: '/import',
            element: <ImportPage />,
          },
          {
            path: '/import/flox',
            element: <ImportFromFloxPage />,
          },
          {
            path: '/import/goodreads',
            element: <ImportFromGoodreadsPage />,
          },
          {
            path: '/import/simkl',
            element: <ImportFromSimklPage />,
          },
          {
            path: '/import/trakt',
            element: <ImportFromTraktPage />,
          },
          {
            path: '/import/ryot',
            element: <ImportFormRyotPage />,
          },
          {
            path: '/import/mediatracker',
            element: <ImportFormMediaTrackerPage />,
          },
          {
            path: '/import/csv',
            element: <ImportFromCsvPage />,
          },
          {
            path: '/integrations',
            element: <IntegrationsPage />,
          },
          {
            path: '/integrations/kodi',
            element: <KodiIntegrationPage />,
          },
          {
            path: '/integrations/jellyfin',
            element: <JellyfinIntegrationPage />,
          },
          {
            path: '/integrations/plex',
            element: <PLexIntegrationsPage />,
          },
          {
            path: '/settings/home-screen',
            element: <HomePageSettingsPage />,
          },
          {
            path: '/settings/password',
            element: <PasswordSettingsPage />,
          },
          {
            path: '/settings/notification-platforms',
            element: <NotificationPlatformsSettingsPage />,
          },
          {
            path: '/settings/preferences',
            element: <PreferencesSettingsPage />,
          },
          {
            path: '/settings/logs',
            element: <LogsPage />,
          },
          {
            path: '/settings/logs/details',
            element: <LogPage />,
          },
          {
            path: '/settings/application-tokens',
            element: <ApplicationTokens />,
          },
          {
            path: '/settings/server-configuration',
            element: <ServerConfigurationPage />,
          },
          {
            path: '/list/:listId',
            element: elementWithParamsFactory((params) => (
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              <ListItemsPage listId={parseInt(params.listId!)} />
            )),
          },
          {
            path: '/details/:mediaItemId',
            element: elementWithParamsFactory((params) => (
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              <DetailsPage mediaItemId={parseInt(params.mediaItemId!)} />
            )),
          },
          ...(['tv', 'movie', 'video_game', 'book', 'audiobook'] as const).map(
            (item) => ({
              path: `/search/${item}`,
              element: <SearchPage key={item} mediaType={item} />,
            })
          ),
        ],
      },
    ],
  },
]);
