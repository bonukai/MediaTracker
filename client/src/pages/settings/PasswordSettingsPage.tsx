import { FC } from 'react';
import { useUser } from '../../hooks/useUser';
import { MainTitle } from '../../components/MainTitle';
import { Trans, t } from '@lingui/macro';
import { Button } from '../../components/Button';
import { Form } from '../../components/Form';
import { trpc } from '../../utils/trpc';

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
  const configurationQuery = trpc.configuration.getPublic.useQuery();

  if (!user.data) {
    return <></>;
  }

  const demoMode = configurationQuery.data?.demoMode === true;

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
          {demoMode && (
            <div className="mb-6 italic text-slate-700">
              Password cannot be changed in DEMO mode
            </div>
          )}

          <PasswordInput
            inputName="currentPassword"
            title={<Trans>Current password</Trans>}
            required
            disabled={demoMode}
          />

          <PasswordInput
            inputName="newPassword"
            title={<Trans>New password</Trans>}
            required
            minLength={8}
            maxLength={1024}
            disabled={demoMode}
          />

          <PasswordInput
            inputName="confirmNewPassword"
            title={<Trans>Confirm new password</Trans>}
            required
            disabled={demoMode}
          />

          {changePassword.isError && changePassword.error?.message && (
            <div className="text-red-600">{changePassword.error.message} </div>
          )}
          {changePassword.isSuccess && (
            <div className="text-green-600">
              <Trans>Password has been changed</Trans>
            </div>
          )}

          <Button isLoading={changePassword.isLoading} disabled={demoMode}>
            <Trans>Change password</Trans>
          </Button>
        </>
      )}
    </Form>
  );
};
