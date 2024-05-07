import { FC, ReactNode } from 'react';
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';

import { Trans } from '@lingui/macro';

import GitHubLogo from '../assets/github.png';
import { useUser } from '../hooks/useUser';
import { cx } from '../utils';
import { trpc } from '../utils/trpc';
import { Button } from './Button';
import { MediaTrackerLogo } from './Icons';

import type { UserResponse } from '@server/entity/userModel';

export const Layout: FC = () => {
  const { user } = useUser();

  if (user.isLoading) {
    return <Trans>Loading</Trans>;
  }

  if (!user.data) {
    return <Navigate to="/login" />;
  }

  return (
    <>
      <div className="">
        <div className="flex flex-row">
          <div className="sticky top-0 bottom-0 self-start h-screen overflow-y-auto bg-[#fdefde]">
            <Sidebar />
          </div>

          <div className="w-full min-h-screen bg-white overflow-clip">
            <div className="mx-4 my-10 md:mx-8">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const Sidebar: FC = () => {
  const { user, logout } = useUser();
  const { data: version } = trpc.serverVersion.get.useQuery();
  const configurationQuery = trpc.configuration.getPublic.useQuery();

  if (user.isLoading || configurationQuery.isLoading) {
    return <Trans>Loading</Trans>;
  }

  if (!user.data) {
    return <Navigate to="/login" />;
  }

  const isAdmin = user.data.admin === true;

  return (
    <>
      <div className="font-semibold tracking-wide text-[#222F4A] flex flex-col gap-3 whitespace-nowrap py-6 pl-8 pr-8 ">
        <MediaTrackerLogo className="w-40 mb-3 h-min" />

        <SidebarLink to="/" displayName={<Trans>Home</Trans>} />
        <SidebarLink displayName={<Trans>Search</Trans>}>
          {showTvCategory(user.data) && (
            <SidebarLink to="/search/tv" displayName={<Trans>TV</Trans>} />
          )}
          {showMovieCategory(user.data) && (
            <SidebarLink
              to="/search/movie"
              displayName={<Trans>Movie</Trans>}
            />
          )}
          {showVideoGameCategory(user.data) && (
            <SidebarLink
              to="/search/video_game"
              displayName={<Trans>Video Game</Trans>}
            />
          )}
          {showBookCategory(user.data) && (
            <SidebarLink to="/search/book" displayName={<Trans>Book</Trans>} />
          )}
          {showAudiobookTvCategory(user.data) && (
            <SidebarLink
              to="/search/audiobook"
              displayName={<Trans>Audiobook</Trans>}
            />
          )}
        </SidebarLink>

        <SidebarLink to="/lists" displayName={<Trans>Lists</Trans>} />
        <SidebarLink to="/calendar" displayName={<Trans>Calendar</Trans>} />
        <SidebarLink to="/upcoming" displayName={<Trans>Upcoming</Trans>} />
        <SidebarLink to="/history" displayName={<Trans>History</Trans>} />
        <SidebarLink to="/progress" displayName={<Trans>Progress</Trans>} />
        <SidebarLink to="/unrated" displayName={<Trans>Unrated</Trans>} />

        <div className="border-b-[1px] my-2 border-slate-300"></div>

        <SidebarLink to="/import" displayName={<Trans>Import</Trans>} />
        <SidebarLink to="/export" displayName={<Trans>Export</Trans>} />
        <SidebarLink
          to="/integrations"
          displayName={<Trans>Integrations</Trans>}
        />

        <SidebarLink displayName={<Trans>Settings</Trans>}>
          <SidebarLink
            to="/settings/home-screen"
            displayName={<Trans>Home screen</Trans>}
          />
          <SidebarLink
            to="/settings/notification-platforms"
            displayName={<Trans>Notification platforms</Trans>}
          />
          {!configurationQuery.data?.demoMode && (
            <SidebarLink
              to="/settings/password"
              displayName={<Trans>Password</Trans>}
            />
          )}
          <SidebarLink
            to="/settings/preferences"
            displayName={<Trans>Preferences</Trans>}
          />
          <SidebarLink
            to="/settings/application-tokens"
            displayName={<Trans>Application tokens</Trans>}
          />
          <SidebarLink
            to="/settings/server-configuration"
            displayName={<Trans>Server configuration</Trans>}
          />
          {isAdmin && (
            <SidebarLink
              to="/settings/logs"
              displayName={<Trans>Logs</Trans>}
            />
          )}
        </SidebarLink>
      </div>

      <div className="flex flex-col gap-3 m-8">
        <Button onClick={logout.mutate}>
          <Trans>Logout</Trans>
        </Button>

        <Trans>Version: {version}</Trans>

        <a href="https://github.com/bonukai/MediaTracker" target="_blank">
          <img src={GitHubLogo} className="h-6" alt="github" />
        </a>
      </div>
    </>
  );
};

const showTvCategory = (user: UserResponse) => {
  return user.preferences.showCategoryTv;
};
const showMovieCategory = (user: UserResponse) => {
  return user.preferences.showCategoryMovie;
};
const showBookCategory = (user: UserResponse) => {
  return user.preferences.showCategoryBook;
};
const showAudiobookTvCategory = (user: UserResponse) => {
  return user.preferences.showCategoryAudiobook;
};
const showVideoGameCategory = (user: UserResponse) => {
  return user.preferences.showCategoryVideoGame;
};

const SidebarLink: FC<
  (
    | {
        to: string;
        children?: never;
      }
    | { to?: never; children: ReactNode }
  ) & { displayName: ReactNode }
> = (props) => {
  const { displayName, to, children } = props;
  const location = useLocation();
  const isActive = to
    ? to === '/'
      ? location.pathname === to
      : location.pathname.startsWith(to)
    : false;

  return (
    <>
      <div className="flex items-center w-fit">
        <span
          className={cx(
            'w-1 h-4 bg-[#fb8500] mr-2 rounded-sm',
            isActive ? '' : 'invisible'
          )}
        ></span>
        {to ? (
          <NavLink to={to} className={'  ' + (isActive ? '  ' : '')}>
            {displayName}
          </NavLink>
        ) : (
          <>{displayName}</>
        )}
      </div>

      {children && (
        <div className="flex flex-col gap-2  text-[14px] font-medium leading-normal tracking-wide  ml-6 mr-8">
          {children}
        </div>
      )}
    </>
  );
};
