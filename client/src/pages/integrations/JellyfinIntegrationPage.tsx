import { FC } from 'react';

import { Trans } from '@lingui/macro';

import { Button } from '../../components/Button';
import { MainTitle } from '../../components/MainTitle';
import { useApiTokenUrlMutation } from '../../hooks/useApiTokenUrl';
import { EmbeddedSingleLineCodeWithCopyButton } from '../../components/EmbeddedSingleLineCodeWithCopyButton';

export const JellyfinIntegrationPage: FC = () => {
  const tokenMutation = useApiTokenUrlMutation({
    type: 'jellyfin',
  });

  return (
    <>
      <MainTitle elements={[<Trans>Integrations</Trans>, <>Jellyfin</>]} />

      <div className="mb-4">
        <Trans>
          You can use a{' '}
          <a
            href="https://github.com/bonukai/jellyfin-plugin-mediatracker"
            target="blank"
            className="link"
          >
            plugin
          </a>{' '}
          for integration with Jellyfin. It requires an API token, that you can
          generate below
        </Trans>
      </div>

      {tokenMutation.data ? (
        <EmbeddedSingleLineCodeWithCopyButton code={tokenMutation.data} />
      ) : (
        <Button
          onClick={tokenMutation.mutate}
          isLoading={tokenMutation.isLoading}
          text={<Trans>Generate API token</Trans>}
        />
      )}
    </>
  );
};
