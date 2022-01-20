import React, { FormEventHandler, FunctionComponent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useConfiguration } from 'src/api/configuration';
import { useRegisterUser, useUser } from 'src/api/user';

export const RegisterPage: FunctionComponent = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { configuration } = useConfiguration();
  const { registerUser, error } = useRegisterUser();

  const onSubmit: FormEventHandler = async (e) => {
    e.preventDefault();

    registerUser({
      username: username,
      password: password,
      confirmPassword: confirmPassword,
    });
  };

  return (
    <div className="flex items-center">
      <div className="mx-auto mt-20">
        <div className="mb-10 text-5xl">Register</div>
        <form onSubmit={onSubmit}>
          <div className="pb-5">
            <label htmlFor="username" className="block text-lg">
              Username:
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

          <div className="pb-5">
            <label htmlFor="password" className="block text-lg">
              Password:
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

          <div className="pb-5">
            <label htmlFor="confirmPassword" className="block text-lg">
              Confirm password:
            </label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              className="w-72"
              required
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div>
            <button className="w-full mt-2">Register</button>
          </div>
        </form>

        {!configuration?.noUsers && (
          <Link to={'/login'}>
            <button className="w-full mt-4">Login</button>
          </Link>
        )}

        {error && (
          <div className="pt-2 font-bold text-red-700 dark:text-red-600">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
