import React, { FormEventHandler, FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useConfiguration } from 'src/api/configuration';
import { useUser } from 'src/api/user';

export const LoginPage: FunctionComponent = () => {
  const { t } = useTranslation();

  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const { login, loginIsError, loginError } = useUser();

  const { configuration, isLoading } = useConfiguration();

  if (isLoading) {
    return <>{t('Loading')}</>;
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
        <div className="mb-10 text-5xl">{t('Login')}</div>
        <form onSubmit={onSubmit}>
          <div className="pb-5">
            <label htmlFor="username" className="block text-lg">
              {t('Username')}:
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
              {t('Password')}:
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
            <button className="w-full mt-2">{t('Login')}</button>
          </div>
        </form>

        {Boolean(configuration?.enableRegistration) && (
          <Link to={'/register'}>
            <button className="w-full mt-4">{t('Register')}</button>
          </Link>
        )}

        {loginIsError && (
          <div className="pt-2 font-bold text-red-700 dark:text-red-600">
            {t('Incorrect password or username')}
          </div>
        )}
      </div>
    </div>
  );
};