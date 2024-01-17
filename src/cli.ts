import chalk from 'chalk';

import { userRepository } from './repository/userRepository.js';

export const listUsers = async () => {
  const users = await userRepository.getAllUsers();

  console.log(
    users
      .map((user) => chalk.bold(user.name) + (user.admin ? ' [admin]' : ''))
      .join('\n')
  );
};

export const resetPassword = async (args: {
  username: string;
  password: string;
}) => {
  await userRepository.resetPassword({
    username: args.username,
    newPassword: args.password,
  });
  console.log(
    `user ${chalk.bold(
      args.username
    )} password has been changed to ${'*'.repeat(args.password.length)}`
  );
};

export const promoteAdmin = async (args: { username: string }) => {
  await userRepository.setAdmin({ username: args.username, admin: true });
  console.log(`user ${chalk.bold(args.username)} is now an admin`);
};

export const demoteAdmin = async (args: { username: string }) => {
  await userRepository.setAdmin({ username: args.username, admin: false });
  console.log(`user ${chalk.bold(args.username)} is not an admin anymore`);
};
