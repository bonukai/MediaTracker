import React, { FunctionComponent, useState } from 'react';
import clsx from 'clsx';

import { NavLink } from 'react-router-dom';
import { animated, Transition } from '@react-spring/web';

import { useUser } from 'src/api/user';
import { useDarkMode } from 'src/hooks/darkMode';

const routes = [
  { path: '/', name: 'Home' },
  { path: '/tv', name: 'Tv' },
  { path: '/movies', name: 'Movies' },
  { path: '/games', name: 'Games' },
  { path: '/books', name: 'Books' },
  { path: '/audiobooks', name: 'Audiobooks' },
  { path: '/upcoming', name: 'Upcoming' },
  { path: '/continue-watching', name: 'Continue watching' },
  { path: '/calendar', name: 'Calendar' },
  { path: '/import', name: 'Import' },
];

export const NavComponent: FunctionComponent = () => {
  const { user, logout } = useUser();

  const { darkMode, setDarkMode } = useDarkMode();
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <>
      {user ? (
        <>
          <nav className="flex items-center">
            <div className="hidden md:block">
              <div className="flex flex-col md:flex-row">
                {routes.map((route) => (
                  <span
                    key={route.path}
                    className="m-1 mr-2 text-xl whitespace-nowrap"
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
            </div>

            <div className="md:hidden">
              <div className="flex flex-col md:flex-row">
                {routes
                  .filter((route) => route.path === location.pathname)
                  .map((route) => (
                    <span
                      key={route.path}
                      className="m-1 mr-2 text-xl whitespace-nowrap"
                    >
                      {route.name}
                    </span>
                  ))}
              </div>
            </div>

            <div className="inline-flex ml-auto mr-2 whitespace-nowrap">
              <span
                onClick={() => setDarkMode(!darkMode)}
                className="pr-2 cursor-pointer select-none material-icons"
              >
                {darkMode ? <>light_mode</> : <>mode_night</>}
              </span>
              <a href="#/settings">{user.name}</a>
              <span className="px-1">|</span>
              <a
                href="/logout"
                onClick={(e) => {
                  e.preventDefault();
                  logout();
                }}
              >
                Logout
              </a>
            </div>

            <span
              className="flex px-2 cursor-pointer md:hidden material-icons"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              {showSidebar ? 'menu_open' : 'menu'}
            </span>
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
              <div
                className={clsx(
                  'fixed top-0 bottom-0 left-0 right-0 z-10 w-full h-full',
                  !showSidebar && 'pointer-events-none'
                )}
                onClick={() => hideSidebar()}
              ></div>

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
                </div>
              </animated.div>
            </>
          )}
        </>
      )}
    </Transition>
  );
};
