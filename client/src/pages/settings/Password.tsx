import React, { useState } from 'react';
import clsx from 'clsx';

import { FetchError } from 'src/api/api';
import { useUser } from 'src/api/user';

export const SettingsPasswordPage = () => {
  const { updatePassword } = useUser();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [success, setSuccess] = useState<boolean>();
  const [message, setMessage] = useState<string>();

  return (
    <>
      <form onSubmit={(e) => e.preventDefault()}>
        <div>Current password</div>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.currentTarget.value)}
          required
        />

        <div>New password</div>
        <input
          type="password"
          value={newPassword}
          required
          onChange={(e) => setNewPassword(e.currentTarget.value)}
        />
        <div>Confirm new password</div>
        <input
          type="password"
          value={confirmNewPassword}
          required
          onChange={(e) => setConfirmNewPassword(e.currentTarget.value)}
        />
        <br />
        <button
          className="mt-2 btn"
          onClick={async () => {
            if (newPassword !== confirmNewPassword) {
              setSuccess(false);
              setMessage('Passwords do not match');
              return;
            }

            try {
              await updatePassword({
                currentPassword: currentPassword,
                newPassword: newPassword,
              });

              setSuccess(true);
              setMessage('Password has been changed');
            } catch (error) {
              if (error instanceof FetchError && error.status === 401) {
                setSuccess(false);
                setMessage('Current password is incorrect');
              }
            }
          }}
        >
          Change password
        </button>
      </form>
      {success !== undefined && (
        <div
          className={clsx('mt-2', success ? 'text-green-500' : 'text-red-500')}
        >
          {message}
        </div>
      )}
    </>
  );
};
