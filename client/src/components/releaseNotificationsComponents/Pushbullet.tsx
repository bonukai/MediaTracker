import { FC } from 'react';

import { Trans } from '@lingui/macro';

import { useUser } from '../../hooks/useUser';
import { Button } from '../Button';
import { Form } from '../Form';
import { AddIcon } from '../Icons';
import { ReleaseNotificationPlatformCredentials } from './types';

export const PushbulletDetails: FC<{
  credentials: ReleaseNotificationPlatformCredentials<'Pushbullet'>;
}> = (props) => {
  const { credentials } = props;

  return (
    <div>
      <Trans>App token:</Trans> {credentials.token}
    </div>
  );
};

export const PushbulletAddForm: FC<{ closeDialog: () => void }> = (props) => {
  const { closeDialog } = props;
  const { addReleaseNotificationPlatform } = useUser();

  return (
    <>
      <Form<ReleaseNotificationPlatformCredentials<'Pushbullet'>>
        onSubmit={async ({ data }) => {
          await addReleaseNotificationPlatform.mutateAsync({
            name: 'Pushbullet',
            credentials: data,
          });
          closeDialog();
        }}
      >
        {({ TextInput }) => (
          <>
            <TextInput
              inputName="token"
              title={<Trans>App token</Trans>}
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
