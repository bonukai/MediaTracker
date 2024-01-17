import { nanoid } from 'nanoid';

import { Database } from '../database.js';
import { SHA256 } from '../utils.js';
import {
  AccessCreatedBy,
  AccessTokenScope,
} from '../entity/accessTokenModel.js';

export const accessTokenRepository = {
  async create(args: {
    name: string;
    userId: number;
    scope?: AccessTokenScope;
    createdBy: AccessCreatedBy;
  }) {
    const { userId, name, scope, createdBy } = args;
    const token = SHA256(nanoid(256)).substring(0, 32);

    await Database.knex.transaction(async (trx) => {
      const user = await trx('user').where('id', userId).first();

      if (!user) {
        throw new Error(`No user with id ${userId}`);
      }

      await trx('accessToken').insert({
        description: name,
        token: SHA256(token),
        userId: userId,
        scope: scope || null,
        createdAt: Date.now(),
        createdBy,
      });
    });

    return token;
  },
  async delete(args: { userId: number; tokenId: number }) {
    const { userId, tokenId } = args;

    await Database.knex('accessToken')
      .where('userId', userId)
      .where('id', tokenId)
      .delete();
  },
  async find(args: { token: string; scope?: AccessTokenScope }) {
    const { token, scope } = args;

    const hashedToken = SHA256(token);

    const existingToken = await Database.knex.transaction(async (trx) => {
      const existingToken = await trx('accessToken')
        .where('token', hashedToken)
        .where((qb) => {
          if (scope) {
            qb.where('scope', scope);
          }
        })
        .first();

      if (!existingToken) {
        return;
      }

      await trx('accessToken')
        .update('lastUsedAt', Date.now())
        .where('id', existingToken.id);

      return existingToken;
    });

    return existingToken?.userId;
  },
  async getAll(args: { userId: number }) {
    const { userId } = args;

    return await Database.knex('accessToken')
      .where('userId', userId)
      .select('createdAt', 'description', 'id', 'lastUsedAt', 'scope');
  },
} as const;
