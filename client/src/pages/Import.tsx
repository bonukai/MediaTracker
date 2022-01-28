import React, { FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useDarkMode } from 'src/hooks/darkMode';

export const ImportPage: FunctionComponent = () => {
  const { darkMode } = useDarkMode();
  const { t } = useTranslation();

  return (
    <div className="flex justify-center w-full mt-4">
      <Link to="trakttv" className="no-underline">
        <div className="flex flex-row items-center text-lg btn-blue">
          {t('Import from')}{' '}
          <img
            src={darkMode ? 'logo/trakt-white.svg' : 'logo/trakt-black.svg'}
            className="inline-block h-8 ml-2 "
          />
        </div>
      </Link>
    </div>
  );
};