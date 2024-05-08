import { FC } from 'react';

import { Trans } from '@lingui/macro';

import { useUser } from '../../hooks/useUser';
import { Button } from '../Button';
import { Form, urlFormValidation } from '../Form';
import { AddIcon } from '../Icons';
import { ReleaseNotificationPlatformCredentials } from './types';

export const DiscordDetails: FC<{
  credentials: ReleaseNotificationPlatformCredentials<'Discord'>;
}> = (props) => {
  const { credentials } = props;

  return (
    <div>
      <Trans>Webhook URL:</Trans> {credentials.url}
    </div>
  );
};

export const DiscordAddForm: FC<{ closeDialog: () => void }> = (props) => {
  const { closeDialog } = props;
  const { addReleaseNotificationPlatform } = useUser();

  return (
    <>
      <Form<ReleaseNotificationPlatformCredentials<'Discord'>>
        onSubmit={async ({ data }) => {
          await addReleaseNotificationPlatform.mutateAsync({
            name: 'Discord',
            credentials: {
              url: data.url,
            },
          });
          closeDialog();
        }}
        validation={{
          url: urlFormValidation,
        }}
      >
        {({ TextInput }) => (
          <>
            <TextInput
              inputName="url"
              title={<Trans>Webhook URL</Trans>}
              required
            />

            <div className="flex justify-between ">
              <Button
                actionType="submit"
                icon={<AddIcon />}
                text={<Trans>Add</Trans>}
                isLoading={addReleaseNotificationPlatform.isLoading}
              />
              <Button
                color="red"
                type="secondary"
                onClick={closeDialog}
                preventDefault
                text={<Trans>Cancel</Trans>}
              />
            </div>
          </>
        )}
      </Form>
    </>
  );
};
