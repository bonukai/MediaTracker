import { FC } from 'react';

import { Trans } from '@lingui/macro';

import { useUser } from '../../hooks/useUser';
import { Button } from '../Button';
import { Form } from '../Form';
import { AddIcon } from '../Icons';
import { ReleaseNotificationPlatformCredentials } from './types';

export const PushoverDetails: FC<{
  credentials: ReleaseNotificationPlatformCredentials<'Pushover'>;
}> = (props) => {
  const { credentials } = props;

  return (
    <div>
      <Trans>User key:</Trans> {credentials.key}
    </div>
  );
};

export const PushoverAddForm: FC<{ closeDialog: () => void }> = (props) => {
  const { closeDialog } = props;
  const { addReleaseNotificationPlatform } = useUser();

  return (
    <>
      <Form<ReleaseNotificationPlatformCredentials<'Pushover'>>
        onSubmit={async ({ data }) => {
          await addReleaseNotificationPlatform.mutateAsync({
            name: 'Pushover',
            credentials: data,
          });
          closeDialog();
        }}
      >
        {({ TextInput }) => (
          <>
            <TextInput
              inputName="key"
              title={<Trans>User key</Trans>}
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
