import React, { FunctionComponent, useState } from 'react';
import clsx from 'clsx';
import { t, Trans } from '@lingui/macro';
import { NavLink, useLocation } from 'react-router-dom';
import { animated, Transition, Spring } from '@react-spring/web';
import styled from 'styled-components';

import { useUser } from 'src/api/user';
import { useDarkMode } from 'src/hooks/darkMode';

const libraryRoutes = [
  { path: '/tv', name: t`Tv` },
  { path: '/movies', name: t`Movies` },
  { path: '/games', name: t`Games` },
  { path: '/books', name: t`Books` },
  { path: '/audiobooks', name: t`Audiobooks` },
];
const extraRoutes = [
  { path: '/in-progress', name: t`In progress` },
  { path: '/watchlist', name: t`Watchlist` },
];
const userRoutes = [
    { path: '/upcoming', name: t`Upcoming`, icon: 'event' },
    { path: '/calendar', name: t`Calendar`, icon: 'calendar_month' },
    { path: '/import', name: t`Import`, icon: 'file_upload' },
    { path: '/lists', name: t`Lists`, icon: 'list' },
    { path: '/settings', name: t`Settings`, icon: 'settings' },
];

export const useRouteNames = () => {
  return [
    { path: '/', name: t`Home` },
    ...libraryRoutes,
    ...userRoutes,
  ];
};

const DropDown = styled.div`
  position: relative;
  nav {
    display: none;
  }
  &:hover {
    nav {
      display: flex;
    }
  }
`;

export const NavComponent: FunctionComponent = () => {
  const { user, logout } = useUser();

  const { darkMode, setDarkMode } = useDarkMode();
  const [showSidebar, setShowSidebar] = useState(false);

  const location = useLocation();
  const routes = useRouteNames();

  return (
    <>
      {user ? (
        <>
          <nav className="border-b-2">
            <div className="container mx-auto py-3 py-3">
              <div className="hidden md:flex flex-row text-l">
              { /* Start desktop nav */ }
                <div className="flex flex-row">
                  <NavLink
                    to='/'
                    className={({ isActive }) =>
                      clsx(isActive && 'underline')
                    }
                  >
                    {t`Home`}
                  </NavLink>

                  <DropDown className="ml-4">
                    <button
                      className="border-none" 
                      type="button">
                      Library
                      <i className=" ml-2 text-sm select-none material-icons">
                        expand_more
                      </i>
                    </button>
                    <nav className="absolute z-10 bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-neutral-700 dark:text-white">
                        <ul className="py-2 flex flex-col flex-grow" aria-labelledby="dropdownDefaultButton">
                        {libraryRoutes.map((route) =>
                          <li key={route.path}>
                            <NavLink to={route.path} className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-800 dark:hover:text-white">
                              {route.name}
                            </NavLink>
                          </li>
                        )}
                        </ul>
                    </nav>
                  </DropDown>

                  {extraRoutes.map((route) => (
                    <span
                      key={route.path}
                      className="ml-4 whitespace-nowrap"
                    >
                      <NavLink
                        to={route.path}
                        className={({ isActive }) =>
                          clsx(isActive && 'underline')
                        }
                      >
                        {route.name}
                      </NavLink>
                    </span>
                  ))}
                </div>

                <DropDown className="ml-auto flex items-center">
                  <a href="#/settings">
                    {user.name}
                    <i className=" ml-2 text-sm select-none material-icons">
                      expand_more
                    </i>
                  </a>
                  <nav className="absolute top-6 right-0 z-10 bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-neutral-700 dark:text-white">
                      <ul className="py-2 flex flex-col flex-grow text-right" aria-labelledby="dropdownDefaultButton">
                        <li className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-800 dark:hover:text-white">
                          <span
                            onClick={() => setDarkMode(!darkMode)}
                            className="cursor-pointer select-none"
                          >
                            {darkMode ? <>Light</> : <>Dark</>} mode
                            <i className=" ml-2 select-none material-icons">
                              {darkMode ? <>light_mode</> : <>mode_night</>}
                            </i>
                          </span>
                        </li>
                        {userRoutes.map((route) =>
                          <li key={route.path}>
                            <NavLink to={route.path} className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-800 dark:hover:text-white">
                              {route.name}
                              <i className=" ml-2 select-none material-icons">
                                {route.icon}
                              </i>
                            </NavLink>
                          </li>
                        )}
                        <li>
                          <a
                            className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-800 dark:hover:text-white"
                            href="/logout"
                            onClick={(e) => {
                              e.preventDefault();
                              logout();
                            }}
                          >
                            <Trans>Logout</Trans>
                            <i className=" ml-2 select-none material-icons">
                              logout
                            </i>
                          </a>
                        </li>
                      </ul>
                  </nav>
                </DropDown>
              </div>
              { /* End desktop nav */ }

              { /* Start mobile nav */ }
              <div className="flex flex-row md:hidden">
                <NavLink
                  to='/'
                  className={({ isActive }) =>
                    clsx(isActive && 'underline')
                  }
                >
                  {t`Home`}
                </NavLink>
                <button className="px-4 ml-auto"
                  onClick={() => setShowSidebar(true)}>
                  <i className="text-sm select-none material-icons">
                    menu
                  </i>
                </button>
              </div>
              { /* End mobile nav */ }
            </div>
          </nav>

          <SideBar
            showSidebar={showSidebar}
            hideSidebar={() => setShowSidebar(false)}
          />
        </>
      ) : (
        <div className="flex items-center">
          <div className="inline-flex ml-auto whitespace-nowrap">
            <span
              onClick={() => setDarkMode(!darkMode)}
              className="pt-2 pr-2 cursor-pointer select-none material-icons"
            >
              {darkMode ? <>light_mode</> : <>mode_night</>}
            </span>
          </div>
        </div>
      )}
    </>
  );
};

const SideBar: FunctionComponent<{
  showSidebar: boolean;
  hideSidebar: () => void;
}> = (props) => {
  const { showSidebar, hideSidebar } = props;
  const routes = useRouteNames();
  const { logout } = useUser();

  return (
    <Transition
      items={showSidebar}
      from={{ marginRight: '-100%' }}
      enter={{ marginRight: '0%' }}
      leave={{ marginRight: '-100%' }}
    >
      {(transitionStyles, show) => (
        <>
          {show && (
            <>
              <Spring
                from={{
                  opacity: 0,
                }}
                to={{
                  opacity: 0.3,
                }}
                reverse={!showSidebar}
              >
                {(styles) => (
                  <animated.div
                    style={styles}
                    className={clsx(
                      'fixed top-0 bottom-0 left-0 right-0 z-10 w-full h-full bg-gray-500',
                      !showSidebar && 'pointer-events-none'
                    )}
                    onClick={() => hideSidebar()}
                  ></animated.div>
                )}
              </Spring>

              <animated.div
                style={transitionStyles}
                className="fixed top-0 right-0 z-50 p-4 pr-10 overflow-hidden bg-red-100 dark:bg-gray-700 -bottom-full"
              >
                <div className="flex flex-col md:flex-row">
                  {routes.map((route) => (
                    <span key={route.path} className="my-2 ml-1 mr-3 text-xl">
                      <NavLink
                        onClick={() => hideSidebar()}
                        to={route.path}
                        className={({ isActive }) =>
                          clsx(isActive && 'selected')
                        }
                      >
                        {route.name}
                      </NavLink>
                    </span>
                  ))}
                  <span className="my-2 ml-1 mr-3 text-xl">
                    <a
                      className=""
                      href="/logout"
                      onClick={(e) => {
                        e.preventDefault();
                        logout();
                      }}
                    >
                      <Trans>Logout</Trans>
                    </a>
                  </span>
                </div>
              </animated.div>
            </>
          )}
        </>
      )}
    </Transition>
  );
};
