import { addDays } from 'date-fns';
import { Database } from '../database.js';
import { SHA256 } from '../utils.js';

export const sessionRepository = {
  async delete(args: { cookie: string }) {
    const hashedSessionToken = SHA256(args.cookie);

    await Database.knex('session').where('sid', hashedSessionToken).delete();
  },
  async findOne(args: { cookie: string }) {
    const hashedSessionToken = SHA256(args.cookie);

    return await Database.knex.transaction(async (trx) => {
      const session = await trx('session')
        .where('sid', hashedSessionToken)
        .where('expiresAt', '>=', Date.now())
        .first();

      if (!session) {
        return;
      }

      session.expiresAt = addDays(new Date(), 30).getTime();

      await trx('session').update('expiresAt', session.expiresAt);

      return session;
    });
  },
  async create(args: { cookie: string; userId: number }) {
    const hashedSessionToken = SHA256(args.cookie);

    const expiresAt = addDays(new Date(), 30);

    const session = {
      sid: hashedSessionToken,
      userId: args.userId,
      expiresAt: expiresAt.getTime(),
    };

    await Database.knex('session').insert(session);

    return session;
  },
} as const;
