import React, { FunctionComponent } from 'react';
import { Trans } from '@lingui/macro';

import { Link } from 'react-router-dom';
import { useDarkMode } from 'src/hooks/darkMode';

const LinkComponent: FunctionComponent<{
  path: string;
  imgSrc: string;
}> = (params) => {
  const { path, imgSrc } = params;

  return (
    <Link to={path} className="mt-4 no-underline w-fit">
      <div className="flex flex-row items-center text-lg btn-blue">
        <Trans>Import from</Trans>{' '}
        <img src={imgSrc} className="inline-block h-8 ml-2 " />
      </div>
    </Link>
  );
};

export const ImportPage: FunctionComponent = () => {
  const { darkMode } = useDarkMode();

  return (
    <div className="flex flex-col items-center justify-center mt-4">
      <LinkComponent
        path="trakttv"
        imgSrc={darkMode ? 'logo/trakt-white.svg' : 'logo/trakt-black.svg'}
      />

      <LinkComponent path="goodreads" imgSrc="logo/goodreads.svg" />
    </div>
  );
};
