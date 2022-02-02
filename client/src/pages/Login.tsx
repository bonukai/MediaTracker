import React, { FormEventHandler, FunctionComponent } from 'react';
import { Trans } from '@lingui/macro';
import { Link } from 'react-router-dom';

import { useConfiguration } from 'src/api/configuration';
import { useUser } from 'src/api/user';

export const LoginPage: FunctionComponent = () => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const { login, loginIsError, loginError } = useUser();

  const { configuration, isLoading } = useConfiguration();

  if (isLoading) {
    return <Trans>Loading</Trans>;
  }

  const onSubmit: FormEventHandler = async (e) => {
    e.preventDefault();

    login({
      username: username,
      password: password,
    });
  };

  return (
    <div className="flex items-center">
      <div className="mx-auto mt-20">
        <div className="mb-10 text-5xl">
          <Trans>Login</Trans>
        </div>
        <form onSubmit={onSubmit}>
          <div className="pb-5">
            <label htmlFor="username" className="block text-lg">
              <Trans>Username</Trans>:
            </label>
            <input
              id="username"
              type="text"
              name="username"
              required
              autoFocus
              className="w-72"
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="pb-2">
            <label htmlFor="password" className="block text-lg">
              <Trans>Password</Trans>:
            </label>
            <input
              id="password"
              type="password"
              name="password"
              className="w-72"
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <button className="w-full mt-2">
              <Trans>Login</Trans>
            </button>
          </div>
        </form>

        {Boolean(configuration?.enableRegistration) && (
          <Link to={'/register'}>
            <button className="w-full mt-4">
              <Trans>Register</Trans>
            </button>
          </Link>
        )}

        {loginIsError && (
          <div className="pt-2 font-bold text-red-700 dark:text-red-600">
            <Trans>Incorrect password or username</Trans>
          </div>
        )}
      </div>
    </div>
  );
};
