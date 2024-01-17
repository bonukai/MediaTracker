import { FC } from 'react';

import { Trans } from '@lingui/macro';

import { Button } from '../../components/Button';
import { MainTitle } from '../../components/MainTitle';
import { useApiTokenUrlMutation } from '../../hooks/useApiTokenUrl';
import { EmbeddedSingleLineCodeWithCopyButton } from '../../components/EmbeddedSingleLineCodeWithCopyButton';

export const KodiIntegrationPage: FC = () => {
  const tokenMutation = useApiTokenUrlMutation({
    type: 'kodi',
  });

  return (
    <>
      <MainTitle elements={[<Trans>Integrations</Trans>, <>Kodi</>]} />

      <div className="mb-4">
        <Trans>
          You can use an{' '}
          <a
            href="https://github.com/bonukai/script.mediatracker"
            target="blank"
            className="link"
          >
            add-on
          </a>{' '}
          for integration with Kodi. It requires an API token, that you can
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
