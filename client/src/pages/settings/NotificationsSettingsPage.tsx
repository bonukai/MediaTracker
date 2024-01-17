import { FC } from 'react';

import { Trans } from '@lingui/macro';

import { MainTitle } from '../../components/MainTitle';
import { useUser } from '../../hooks/useUser';

export const NotificationsSettingsPage: FC = () => {
  const { user } = useUser();

  if (!user.data) {
    return <></>;
  }

  return (
    <>
      <MainTitle
        elements={[<Trans>Settings</Trans>, <Trans>Notifications</Trans>]}
      />

      <>Not implemented</>
    </>
  );
};
