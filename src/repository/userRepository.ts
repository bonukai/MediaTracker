import argon2 from 'argon2';
import _ from 'lodash';

import { TRPCError } from '@trpc/server';

import {
  NotificationPlatform,
  UserPreferences,
  notificationPlatformsSchema,
  userPreferencesSchema,
  userResponseSchema,
} from '../entity/userModel.js';
import { Database } from '../database.js';
import { nanoid } from 'nanoid';

export const userRepository = {
  async get(args: { userId: number }) {
    const { userId } = args;

    const user = await Database.knex('user').where('id', userId).first();

    if (!user) {
      throw new Error(`user with id ${userId} does not exists`);
    }

    return userResponseSchema.parse({
      ..._.omit(user, 'password'),
      preferences: user.preferencesJson ? JSON.parse(user.preferencesJson) : {},
      notificationPlatforms: user.notificationPlatformsJson
        ? JSON.parse(user.notificationPlatformsJson)
        : [],
    });
  },
  async updatePreferences(args: {
    userId: number;
    newPreferences: Partial<UserPreferences>;
  }) {
    const { userId, newPreferences } = args;
    return await Database.knex.transaction(async (trx) => {
      const user = await trx('user').where('id', userId).first();

      if (!user) {
        throw new Error(`no user ${userId}`);
      }

      const currentPreferences = userPreferencesSchema.parse(
        JSON.parse(user.preferencesJson || '{}')
      );
      const mergedPreferences = _.mergeWith(
        currentPreferences,
        newPreferences,
        (objValue, srcValue) => {
          if (_.isArray(objValue)) {
            return srcValue;
          }
        }
      );

      await trx('user')
        .where('id', userId)
        .update('preferencesJson', JSON.stringify(mergedPreferences));
    });
  },
  async addReleaseNotificationPlatform(args: {
    userId: number;
    notificationPlatform: NotificationPlatform;
  }) {
    const { userId, notificationPlatform } = args;

    await Database.knex.transaction(async (trx) => {
      const user = await trx('user').where('id', userId).first();

      if (!user) {
        throw new Error(`no user ${userId}`);
      }

      const currentPlatforms = notificationPlatformsSchema.parse(
        JSON.parse(user.notificationPlatformsJson || '[]')
      );

      currentPlatforms.push({
        addedAt: Date.now(),
        id: nanoid(),
        ...notificationPlatform,
        description: null,
      });

      await trx('user')
        .where('id', userId)
        .update(
          'notificationPlatformsJson',
          JSON.stringify([...currentPlatforms])
        );
    });
  },
  async removeReleaseNotificationPlatform(args: {
    userId: number;
    id: string;
  }) {
    const { userId, id } = args;

    await Database.knex.transaction(async (trx) => {
      const user = await trx('user').where('id', userId).first();

      if (!user) {
        throw new Error(`no user ${userId}`);
      }

      const currentPlatforms = notificationPlatformsSchema.parse(
        JSON.parse(user.notificationPlatformsJson || '[]')
      );

      await trx('user')
        .where('id', userId)
        .update(
          'notificationPlatformsJson',
          JSON.stringify(currentPlatforms.filter((item) => item.id !== id))
        );
    });
  },
  async create(args: { username: string; password: string }) {
    const password = await argon2.hash(args.password);

    return await Database.knex.transaction(async (trx) => {
      const existingUser = await trx('user')
        .where('name', args.username)
        .first();

      if (existingUser) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'user already exists',
        });
      }

      const [numberOfUsers] = await trx('user').count<
        {
          count: number;
        }[]
      >({ count: '*' });

      const [user] = await trx('user')
        .insert({
          name: args.username,
          password: password,
          admin: numberOfUsers.count === 0,
        })
        .returning('*');

      await trx('list').insert({
        userId: user.id,
        isWatchlist: true,
        name: 'Watchlist',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        sortBy: 'recently-watched',
        sortOrder: 'desc',
        privacy: 'private',
      });

      const defaultSections = [
        {
          hidden: false,
          type: 'builtin',
          name: 'builtin-section-upcoming',
          position: 0,
        },
        {
          hidden: false,
          type: 'builtin',
          name: 'builtin-section-next-episode-to-watch',
          position: 1,
        },
        {
          hidden: false,
          type: 'builtin',
          name: 'builtin-section-recently-released',
          position: 2,
        },
        {
          hidden: false,
          type: 'builtin',
          name: 'builtin-section-unrated',
          position: 3,
        },
      ];

      await trx('homeSection').insert(
        defaultSections.map((section) => ({
          userId: user.id,
          name: section.name,
          position: section.position,
          configurationJson: JSON.stringify(section),
        }))
      );

      return user;
    });
  },
  async verifyPassword(args: { username: string; password: string }) {
    return await Database.knex.transaction(async (trx) => {
      const user = await trx('user').where('name', args.username).first();

      if (!user) {
        return;
      }

      if (user.password === null || user.password === undefined) {
        return {
          id: user.id,
          name: user.name,
        };
      }

      if (await argon2.verify(user.password, args.password)) {
        return {
          id: user.id,
          name: user.name,
        };
      }
    });
  },
  async resetPassword(args: { username: string; newPassword: string }) {
    const hashedNewPassword = await argon2.hash(args.newPassword);

    await Database.knex.transaction(async (trx) => {
      const user = await trx('user').where('name', args.username).first();

      if (!user) {
        throw new Error(`no user ${args.username}`);
      }

      await trx('user')
        .update('password', hashedNewPassword)
        .where('id', user.id);
    });
  },
  async changePassword(args: {
    userId: number;
    currentPassword: string;
    newPassword: string;
  }) {
    const hashedNewPassword = await argon2.hash(args.newPassword);

    return await Database.knex.transaction(async (trx) => {
      const user = await trx('user').where('id', args.userId).first();

      if (!user) {
        throw new Error(`no user ${args.userId}`);
      }

      if (!(await argon2.verify(user.password, args.currentPassword))) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'incorrect password',
        });
      }

      await trx('user')
        .update('password', hashedNewPassword)
        .where('id', user.id);
    });
  },
  async getAllUsers() {
    const users = await Database.knex.transaction(async (trx) => {
      const users = await trx('user')
        .select('id', 'name', 'admin')
        .orderBy('name');

      return users;
    });

    return _.sortBy(users, (user) => user.name);
  },
  async setAdmin(args: { username: string; admin: boolean }) {
    const res = await Database.knex('user')
      .update('admin', args.admin)
      .where('name', args.username);

    if (res === 0) {
      throw new Error(`user ${args.username} does not exists`);
    }
  },
} as const;
