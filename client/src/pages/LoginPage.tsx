import { FC } from 'react';
import { trpc } from '../utils/trpc';
import { Link, Navigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { Trans } from '@lingui/macro';
import { MediaTrackerLogo } from '../components/Icons';
import { Button } from '../components/Button';
import { Form } from '../components/Form';

export const LoginPage: FC = () => {
  const { user, login } = useUser();

  const configuration = trpc.configuration.getPublic.useQuery();

  if (configuration.isLoading || user.isLoading) {
    return <Trans>Loading</Trans>;
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

          <Form<{ username: string; password: string }>
            onSubmit={({ data }) => {
              login.mutate(data);
            }}
          >
            {({ TextInput, PasswordInput }) => (
              <>
                <div className="text-4xl"></div>
                <TextInput
                  inputName="username"
                  title={<Trans>Username</Trans>}
                  required
                  autoFocus
                />

                <PasswordInput
                  inputName="password"
                  title={<Trans>Password</Trans>}
                  required
                />

                {login.isError && login.error?.message && (
                  <div className="text-red-600">{login.error.message} </div>
                )}

                <div className="flex justify-between">
                  <Button actionType="submit" isLoading={login.isLoading}>
                    <Trans>Login</Trans>
                  </Button>
                  {configuration.data?.enableRegistration && (
                    <Link to="/register">
                      <Button type="secondary">
                        <Trans>Register</Trans>
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
