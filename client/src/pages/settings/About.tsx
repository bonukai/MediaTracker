import { Trans } from '@lingui/macro';
import React, { FunctionComponent } from 'react';
import { useConfiguration } from 'src/api/configuration';

export const SettingsAboutPage: FunctionComponent = () => {
  const { configuration } = useConfiguration();

  return (
    <>
      <div>
        <Trans>Version</Trans>: {configuration.version}
      </div>
    </>
  );
};
