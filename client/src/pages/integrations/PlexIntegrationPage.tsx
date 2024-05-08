import { FC } from 'react';

import { Trans, t } from '@lingui/macro';

import { Button } from '../../components/Button';
import { MainTitle } from '../../components/MainTitle';
import { useApiTokenUrlMutation } from '../../hooks/useApiTokenUrl';
import { EmbeddedSingleLineCodeWithCopyButton } from '../../components/EmbeddedSingleLineCodeWithCopyButton';
import { Form } from '../../components/Form';

export const PLexIntegrationsPage: FC = () => {
  const tokenMutation = useApiTokenUrlMutation({
    type: 'plex',
  });

  return (
    <>
      <MainTitle elements={[<Trans>Integrations</Trans>, <>Plex</>]} />

      <div className="mb-8">
        <Trans>
          Plex integration uses{' '}
          <a
            href="https://support.plex.tv/articles/115002267687-webhooks/"
            target="_blank"
            className="link"
          >
            Webhooks, which are a premium feature and require an active Plex
            Pass Subscriptions subscription for the Plex Media Server account
          </a>
        </Trans>
      </div>

      {tokenMutation.data ? (
        <div>
          <EmbeddedSingleLineCodeWithCopyButton code={tokenMutation.data} />

          <div className="mt-4">
            <Trans>
              Paste above URL to{' '}
              <a
                href="https://app.plex.tv/desktop/#!/settings/webhooks"
                target="_blank"
                className="link"
              >
                your Plex server settings
              </a>
            </Trans>
          </div>

          <Button
            className="mt-4"
            onClick={tokenMutation.reset}
            text={<Trans>Go back</Trans>}
          />
        </div>
      ) : (
        <Form<{ plexUserId?: number; plexUserName?: string }>
          validation={{
            plexUserId(value: unknown) {
              if (
                typeof value === 'string' &&
                value.length > 0 &&
                isNaN(parseInt(value))
              ) {
                return {
                  message: t`enter number`,
                };
              }
            },
          }}
          onSubmit={({ data }) => {
            tokenMutation.mutate(data);
          }}
          className="flex flex-col gap-3 mt-4 w-fit"
        >
          {({ TextInput }) => (
            <>
              <TextInput
                inputName="plexUserName"
                title={<Trans>Plex username</Trans>}
              />
              <TextInput
                inputName="plexUserId"
                title={<Trans>Plex user id</Trans>}
              />

              <Button
                isLoading={tokenMutation.isLoading}
                text={<Trans>Generate Webhook URL</Trans>}
              />
            </>
          )}
        </Form>
      )}
    </>
  );
};
