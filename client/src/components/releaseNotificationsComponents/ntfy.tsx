import { FC } from 'react';

import { Trans } from '@lingui/macro';

import { useUser } from '../../hooks/useUser';
import { Button } from '../Button';
import { Form, urlFormValidation } from '../Form';
import { AddIcon } from '../Icons';
import { ReleaseNotificationPlatformCredentials } from './types';

export const NtfyDetails: FC<{
  credentials: ReleaseNotificationPlatformCredentials<'ntfy'>;
}> = (props) => {
  const { credentials } = props;

  return (
    <div>
      <p>
        <Trans>Topic:</Trans> {credentials.topic}
      </p>
      {credentials.url && (
        <p>
          <Trans>URL:</Trans> {credentials.url}
        </p>
      )}
    </div>
  );
};

export const NtfyAddForm: FC<{ closeDialog: () => void }> = (props) => {
  const { closeDialog } = props;
  const { addReleaseNotificationPlatform } = useUser();

  return (
    <>
      <Form<ReleaseNotificationPlatformCredentials<'ntfy'>>
        onSubmit={async ({ data }) => {
          await addReleaseNotificationPlatform.mutateAsync({
            name: 'ntfy',
            credentials: {
              topic: data.topic,
              priority: Number(data.priority) || null,
              url: data.url || null,
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
              inputName="topic"
              title={<Trans>Topic</Trans>}
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
              description={<Trans>only for self hosting</Trans>}
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
