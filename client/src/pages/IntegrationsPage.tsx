import { FC } from 'react';
import { Link } from 'react-router-dom';

import { Trans } from '@lingui/macro';

import jellyfinLogo from '../assets/jellyfin.svg';
import kodiLogo from '../assets/kodi.svg';
import plexLogo from '../assets/plex.svg';
import { MainTitle } from '../components/MainTitle';
import { Button } from '../components/Button';

export const IntegrationsPage: FC = () => {
  return (
    <>
      <MainTitle>
        <Trans>Integrations</Trans>
      </MainTitle>

      <div className="flex flex-col gap-3 w-fit">
        <Link to="/integrations/plex">
          <Button className=" !bg-slate-500 w-full">
            <img src={plexLogo} className="h-8" />
          </Button>
        </Link>

        <Link to="/integrations/kodi">
          <Button className=" !bg-slate-500 w-full">
            <img src={kodiLogo} className="h-8" />
          </Button>
        </Link>

        <Link to="/integrations/jellyfin">
          <Button className=" !bg-slate-500 w-full">
            <img src={jellyfinLogo} className="h-8" />
          </Button>
        </Link>
      </div>
    </>
  );
};
