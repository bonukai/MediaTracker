import React from 'react';
import { useUser } from 'src/api/user';

export const SettingsPasswordPage = () => {
  const { updatePassword } = useUser();

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <div>Current password</div>
      <input type="password" />

      <div>New password</div>
      <input type="password" />
      <div>Confirm new password</div>
      <input type="password" />
      <br />
      <button
        className="mt-2 btn"
        onClick={() => updatePassword({ currentPassword: '', newPassword: '' })}
      >
        Change password
      </button>
    </form>
  );
};
