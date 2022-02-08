import React, { useState } from 'react';
import clsx from 'clsx';
import { t, Trans } from '@lingui/macro';

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
        <div>
          <Trans>Current password</Trans>
        </div>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.currentTarget.value)}
          required
        />

        <div>
          <Trans>New password</Trans>
        </div>
        <input
          type="password"
          value={newPassword}
          required
          onChange={(e) => setNewPassword(e.currentTarget.value)}
        />
        <div>
          <Trans>Confirm new password</Trans>
        </div>
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
              setMessage(t`Passwords do not match`);
              return;
            }

            try {
              await updatePassword({
                currentPassword: currentPassword,
                newPassword: newPassword,
              });

              setSuccess(true);
              setMessage(t`Password has been changed`);
            } catch (error) {
              if (error instanceof FetchError && error.status === 401) {
                setSuccess(false);
                setMessage(t`Current password is incorrect`);
              }
            }
          }}
        >
          <Trans>Change password</Trans>
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
