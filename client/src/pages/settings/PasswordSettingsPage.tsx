import { FC } from 'react';
import { useUser } from '../../hooks/useUser';
import { MainTitle } from '../../components/MainTitle';
import { Trans, t } from '@lingui/macro';
import { Button } from '../../components/Button';
import { Form } from '../../components/Form';

export const PasswordSettingsPage: FC = () => {
  return (
    <>
      <MainTitle
        elements={[<Trans>Settings</Trans>, <Trans>Password</Trans>]}
      />

      <PasswordChangeFrom />
    </>
  );
};

const PasswordChangeFrom: FC = () => {
  const { user, changePassword } = useUser();

  if (!user.data) {
    return <></>;
  }

  return (
    <Form<{
      currentPassword: string;
      newPassword: string;
      confirmNewPassword: string;
    }>
      onSubmit={async ({ data, clearForm, submitValidation }) => {
        if (data.newPassword !== data.confirmNewPassword) {
          submitValidation({
            inputName: 'confirmNewPassword',
            message: t`Passwords do not match`,
          });
          return;
        }

        await changePassword.mutateAsync({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        });

        clearForm();
      }}
    >
      {({ PasswordInput }) => (
        <>
          <PasswordInput
            inputName="currentPassword"
            title={<Trans>Current password</Trans>}
            required
          />

          <PasswordInput
            inputName="newPassword"
            title={<Trans>New password</Trans>}
            required
            minLength={8}
            maxLength={1024}
          />

          <PasswordInput
            inputName="confirmNewPassword"
            title={<Trans>Confirm new password</Trans>}
            required
          />

          {changePassword.isError && changePassword.error?.message && (
            <div className="text-red-600">{changePassword.error.message} </div>
          )}
          {changePassword.isSuccess && (
            <div className="text-green-600">
              <Trans>Password has been changed</Trans>
            </div>
          )}

          <Button isLoading={changePassword.isLoading}>
            <Trans>Change password</Trans>
          </Button>
        </>
      )}
    </Form>
  );
};
