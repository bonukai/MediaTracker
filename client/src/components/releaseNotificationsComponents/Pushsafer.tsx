import { FC } from 'react';

import { Trans } from '@lingui/macro';

import { useUser } from '../../hooks/useUser';
import { Button } from '../Button';
import { Form } from '../Form';
import { AddIcon } from '../Icons';
import { ReleaseNotificationPlatformCredentials } from './types';

export const PushsaferDetails: FC<{
  credentials: ReleaseNotificationPlatformCredentials<'Pushsafer'>;
}> = (props) => {
  const { credentials } = props;

  return (
    <div>
      <Trans>Key:</Trans> {credentials.key}
    </div>
  );
};

export const PushsaferAddForm: FC<{ closeDialog: () => void }> = (props) => {
  const { closeDialog } = props;
  const { addReleaseNotificationPlatform } = useUser();

  return (
    <>
      <Form<ReleaseNotificationPlatformCredentials<'Pushsafer'>>
        onSubmit={async ({ data }) => {
          await addReleaseNotificationPlatform.mutateAsync({
            name: 'Pushsafer',
            credentials: data,
          });
          closeDialog();
        }}
      >
        {({ TextInput }) => (
          <>
            <TextInput inputName="key" title={<Trans>Key</Trans>} required />

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
