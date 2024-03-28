import { FC } from 'react';
import { trpc } from '../utils/trpc';
import { Link, Navigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { Trans, t } from '@lingui/macro';
import { MediaTrackerLogo } from '../components/Icons';
import { Form } from '../components/Form';
import { Button } from '../components/Button';

export const RegisterPage: FC = () => {
  const { user, register } = useUser();
  const configuration = trpc.configuration.getPublic.useQuery();

  if (configuration.isLoading || user.isLoading) {
    return <Trans>Loading</Trans>;
  }

  if (configuration.data?.enableRegistration !== true) {
    return <Navigate to="/login" />;
  }

  if (user.data) {
    return <Navigate to="/" />;
  }

  return (
    <div className="mt-32">
      <div className="flex flex-col items-center justify-center">
        <div className="p-8 rounded bg-slate-100">
          <div className="flex flex-col items-center justify-center mb-8 ">
            <MediaTrackerLogo className="w-72 h-min" />
          </div>

          <Form<{
            username: string;
            password: string;
            confirmPassword: string;
          }>
            onSubmit={({ data, submitValidation }) => {
              if (data.password !== data.confirmPassword) {
                submitValidation({
                  inputName: 'confirmPassword',
                  message: t`passwords do not match`,
                });
                return;
              }

              register.mutate(data);
            }}
          >
            {({ TextInput, PasswordInput }) => (
              <>
                <div className="text-4xl"></div>
                <TextInput
                  inputName="username"
                  title={<Trans>Username</Trans>}
                  required
                  minLength={3}
                  maxLength={20}
                  autoFocus
                />

                <PasswordInput
                  inputName="password"
                  title={<Trans>Password</Trans>}
                  required
                  minLength={8}
                  maxLength={1024}
                />

                <PasswordInput
                  inputName="confirmPassword"
                  title={<Trans>Confirm password</Trans>}
                  required
                  minLength={8}
                  maxLength={1024}
                />

                {register.isError && register.error?.message && (
                  <div className="text-red-600">{register.error.message} </div>
                )}

                <div className="flex justify-between">
                  <Button actionType="submit" isLoading={register.isLoading}>
                    <Trans>Register</Trans>
                  </Button>

                  {configuration.data?.enableRegistration && (
                    <Link to="/login">
                      <Button type="secondary">
                        <Trans>Login</Trans>
                      </Button>
                    </Link>
                  )}
                </div>
              </>
            )}
          </Form>
        </div>
      </div>
    </div>
  );
};
