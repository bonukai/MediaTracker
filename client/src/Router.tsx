import React, { FunctionComponent } from 'react';
import { Navigate, Routes, Route, Outlet } from 'react-router-dom';

import { DetailsPage } from 'src/pages/Details';
import { HomePage } from 'src/pages/Home';
import { LoginPage } from 'src/pages/Login';
import { ItemsPage } from 'src/pages/ItemsPage';
import { useUser } from 'src/api/user';
import { NavComponent } from 'src/components/Nav';
import { UpcomingPage } from 'src/pages/Upcoming';
import { ContinueWatchingPage } from 'src/pages/ContinueWatching';
import { SettingsPage } from 'src/pages/Settings';
import { EpisodesPage } from 'src/pages/Episodes';
import { CalendarPage } from 'src/pages/Calendar';
import { RegisterPage } from 'src/pages/Register';
import { useConfiguration } from 'src/api/configuration';
import { NotFound } from 'src/pages/NotFound';
import { SeenHistoryPage } from 'src/pages/SeenHistory';

export const MyRouter: FunctionComponent = () => {
  const { isLoading, user } = useUser();
  const { configuration, isLoading: isLoadingConfiguration } =
    useConfiguration();

  if (isLoading || isLoadingConfiguration) return <>{'Loading...'}</>;

  return (
    <>
      <Routes>
        <Route element={<PageLayout />}>
          {user ? (
            <>
              <Route
                path="/login"
                element={<Navigate to="/" replace={true} />}
              />

              {configuration.enableRegistration && (
                <Route
                  path="/register"
                  element={<Navigate to="/" replace={true} />}
                />
              )}

              <Route path="/" element={<HomePage />} />

              <Route path="/settings/*" element={<SettingsPage />} />
              <Route
                path="/tv"
                element={<ItemsPage key="/tv" mediaType="tv" />}
              />
              <Route
                path="/movies"
                element={<ItemsPage key="/movies" mediaType="movie" />}
              />
              <Route
                path="/games"
                element={<ItemsPage key="/games" mediaType="video_game" />}
              />
              <Route
                path="/books"
                element={<ItemsPage key="/books" mediaType="book" />}
              />
              <Route
                path="/audiobooks"
                element={<ItemsPage key="/audiobooks" mediaType="audiobook" />}
              />

              <Route path="/upcoming" element={<UpcomingPage />} />
              <Route
                path="/continue-watching"
                element={<ContinueWatchingPage />}
              />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/details/:mediaItemId" element={<DetailsPage />} />
              <Route path="/episodes/:mediaItemId" element={<EpisodesPage />} />
              <Route
                path="/seen-history/:mediaItemId"
                element={<SeenHistoryPage />}
              />
            </>
          ) : (
            <>
              {!configuration.noUsers && (
                <Route path="/login" element={<LoginPage />} />
              )}

              {configuration.enableRegistration && (
                <Route path="/register" element={<RegisterPage />} />
              )}
            </>
          )}
        </Route>

        <Route
          path="*"
          element={
            user ? (
              <NotFound />
            ) : (
              <Navigate
                to={configuration.noUsers ? '/register' : '/login'}
                replace={true}
              />
            )
          }
        />
      </Routes>
    </>
  );
};

const PageLayout: FunctionComponent = () => {
  return (
    <>
      <NavComponent />

      <div className="flex flex-col items-center max-w-5xl m-auto">
        <div className="w-full p-2" key={location.pathname}>
          <Outlet />
        </div>
      </div>
    </>
  );
};
