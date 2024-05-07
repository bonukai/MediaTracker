import { FC } from 'react';

import { Trans } from '@lingui/macro';

import { useUser } from '../../hooks/useUser';
import { Button } from '../Button';
import { Form, urlFormValidation } from '../Form';
import { AddIcon } from '../Icons';
import { ReleaseNotificationPlatformCredentials } from './types';

export const GotifyDetails: FC<{
  credentials: ReleaseNotificationPlatformCredentials<'gotify'>;
}> = (props) => {
  const { credentials } = props;

  return (
    <div>
      <p>
        <Trans>Token:</Trans> {credentials.token}
      </p>
      {credentials.url && (
        <p>
          <Trans>URL:</Trans> {credentials.url}
        </p>
      )}
    </div>
  );
};

export const GotifyAddForm: FC<{ closeDialog: () => void }> = (props) => {
  const { closeDialog } = props;
  const { addReleaseNotificationPlatform } = useUser();

  return (
    <>
      <Form<ReleaseNotificationPlatformCredentials<'gotify'>>
        onSubmit={async ({ data }) => {
          await addReleaseNotificationPlatform.mutateAsync({
            name: 'gotify',
            credentials: {
              token: data.token,
              priority: Number(data.priority) || null,
              url: data.url,
            },
          });
          closeDialog();
        }}
        validation={{
          url: urlFormValidation,
        }}
      >
        {({ TextInput, SelectInput }) => (
          <>
            <TextInput
              inputName="token"
              title={<Trans>Token</Trans>}
              required
            />

            <SelectInput
              inputName="priority"
              title={<Trans>Priority</Trans>}
              options={new Array(5)
                .fill(null)
                .map((_, index) => (index + 1).toString())
                .map((value) => ({
                  name: value,
                  value: value,
                }))}
            />

            <TextInput
              inputName="url"
              title={<Trans>Server url</Trans>}
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
