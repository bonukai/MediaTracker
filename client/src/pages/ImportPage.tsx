import { FC } from 'react';
import { Link } from 'react-router-dom';

import { Trans } from '@lingui/macro';

import { Button } from '../components/Button';
import {
  floxLogo,
  goodreadsLogo,
  ryotLogo,
  simklLogo,
  traktLogoBlack,
} from '../components/Logos';
import { MainTitle } from '../components/MainTitle';

export const ImportPage: FC = () => {
  return (
    <>
      <MainTitle>
        <Trans>Import</Trans>
      </MainTitle>

      <div className="flex flex-col items-start gap-4 w-fit">
        <ImportLinkComponent path="goodreads" imgSrc={goodreadsLogo} />
        <ImportLinkComponent path="trakt" imgSrc={traktLogoBlack} />
        <ImportLinkComponent path="flox" imgSrc={floxLogo} />
        <ImportLinkComponent path="simkl" imgSrc={simklLogo} />
        <ImportLinkComponent path="ryot" imgSrc={ryotLogo} />
        <ImportLinkComponent path="mediatracker" text="backup" />
      </div>
    </>
  );
};

const ImportLinkComponent: FC<{
  path: string;
  imgSrc?: string;
  text?: string;
}> = (params) => {
  const { path, imgSrc, text } = params;

  return (
    <Link to={path} className="w-full">
      <Button className="w-full">
        <Trans>Import from</Trans>{' '}
        {imgSrc && <img src={imgSrc} className="inline-block h-8" />}
        {text && <>{text}</>}
      </Button>
    </Link>
  );
};
