import React, { FunctionComponent } from 'react';
import { Navigate, Routes, Route, Outlet } from 'react-router-dom';

import { DetailsPage } from 'src/pages/Details';
import { HomePage } from 'src/pages/Home';
import { LoginPage } from 'src/pages/Login';
import { ItemsPage } from 'src/pages/ItemsPage';
import { useUser } from 'src/api/user';
import { NavComponent } from 'src/components/Nav';
import { UpcomingPage } from 'src/pages/Upcoming';
import { InProgressPage } from 'src/pages/InProgress';
import { SettingsPage } from 'src/pages/Settings';
import { SeasonsPage } from 'src/pages/SeasonsPage';
import { CalendarPage } from 'src/pages/Calendar';
import { RegisterPage } from 'src/pages/Register';
import { useConfiguration } from 'src/api/configuration';
import { NotFound } from 'src/pages/NotFound';
import { SeenHistoryPage } from 'src/pages/SeenHistory';
import { ImportPage } from 'src/pages/Import';
import { TraktTvImportPage } from 'src/pages/import/TraktTv';
import { WatchlistPage } from 'src/pages/WatchlistPage';
import { GoodreadsImportPage } from 'src/pages/import/Goodreads';
import { ListPage } from 'src/pages/ListPage';
import { EpisodePage } from 'src/pages/EpisodePage';
import { ListsPage } from 'src/pages/ListsPage';

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

              <Route
                path="/settings/*"
                element={<SettingsPage key="settings" />}
              />
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

              <Route
                path="/upcoming"
                element={<UpcomingPage key="/audiobooks" />}
              />
              <Route
                path="/watchlist"
                element={<WatchlistPage key="/watchlist" />}
              />

              <Route
                path="/in-progress"
                element={<InProgressPage key="/in-progress" />}
              />
              <Route
                path="/calendar"
                element={<CalendarPage key="/calendar" />}
              />
              <Route
                path="/details/:mediaItemId"
                element={<DetailsPage key="/details" />}
              />
              <Route
                path="/seasons/:mediaItemId/"
                element={<SeasonsPage key="/seasons" />}
              />
              <Route
                path="/seasons/:mediaItemId/:seasonNumber"
                element={<SeasonsPage key="/seasons" />}
              />
              <Route
                path="/episode/:mediaItemId/:seasonNumber/:episodeNumber"
                element={<EpisodePage key="/episode" />}
              />
              <Route
                path="/seen-history/:mediaItemId"
                element={<SeenHistoryPage key="/seen-history" />}
              />

              <Route path="/lists" element={<ListsPage key="/lists" />} />

              <Route path="/list/:listId" element={<ListPage key="/list" />} />

              <Route path="/import" element={<ImportPage key="/import" />} />
              <Route
                path="/import/trakttv"
                element={<TraktTvImportPage key="/import/trakttv" />}
              />
              <Route
                path="/import/goodreads"
                element={<GoodreadsImportPage key="/import/goodreads" />}
              />
            </>
          ) : (
            <>
              {!configuration.noUsers && (
                <Route path="/login" element={<LoginPage key="/login" />} />
              )}

              {configuration.enableRegistration && (
                <Route
                  path="/register"
                  element={<RegisterPage key="/register" />}
                />
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
