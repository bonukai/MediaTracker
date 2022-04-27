import React, { useState, FunctionComponent, useRef, useEffect } from 'react';
import clsx from 'clsx';

export const useMenuComponent = <T extends string>(args: {
  values: T[];
  initialSelection?: T;
}) => {
  const { values, initialSelection } = args;
  const [selectedValue, setSelectedValue] = useState(initialSelection);

  useEffect(() => {
    if (selectedValue === undefined && initialSelection !== undefined) {
      setSelectedValue(initialSelection);
    }
  }, [selectedValue, initialSelection]);

  const Menu: FunctionComponent = (params) => {
    const { children } = params;
    const [showMenu, setShowMenu] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
      const handler = (event: MouseEvent) => {
        if (
          ref &&
          ref.current &&
          ref.current !== event.target &&
          !ref.current.contains(event.target)
        ) {
          setShowMenu(false);
        }
      };

      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
      <div className="flex select-none">
        <div
          className="relative ml-2 cursor-pointer select-none"
          ref={ref}
          onClick={() => setShowMenu(!showMenu)}
        >
          {children}
          {showMenu && (
            <ul className="absolute right-0 z-10 transition-all rounded shadow-lg shadow-black bg-zinc-100 dark:bg-gray-900">
              {values.map((value) => (
                <li
                  key={value}
                  className={clsx(
                    'px-2 py-1 rounded hover:bg-red-700 whitespace-nowrap',
                    selectedValue === value && 'dark:bg-slate-700 bg-zinc-300'
                  )}
                  onClick={() => {
                    setSelectedValue(value);
                  }}
                >
                  {value}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  };

  return {
    Menu: Menu,
    selectedValue: selectedValue,
  };
};
