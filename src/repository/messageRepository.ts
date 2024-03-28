import _ from 'lodash';
import { Database } from '../database.js';
import { MessageModel } from '../entity/messageModel.js';

export const messageRepository = {
  async get(args: { userId: number }): Promise<MessageModel[]> {
    const res = await Database.knex('message').where('userId', args.userId);

    return _.sortBy(res, (item) => item.createdAt);
  },
  async markAsRead(args: { id: number[]; userId: number }): Promise<void> {
    await Database.knex('message')
      .update('read', true)
      .whereIn('id', args.id)
      .where('userId', args.userId);
  },
  async getNumberOfUnreadMessages(args: { userId: number }): Promise<number> {
    const res = await Database.knex('message')
      .where('userId', args.userId)
      .where('read', false)
      .count({ count: '*' })
      .first();

    return res?.count as number;
  },
  async delete(args: { id: number[]; userId: number }): Promise<void> {
    await Database.knex('message')
      .delete()
      .whereIn('id', args.id)
      .where('userId', args.userId);
  },
  async send(args: { userId: number; message: string }): Promise<void> {
    await Database.knex('message').insert({
      createdAt: new Date().getTime(),
      read: false,
      userId: args.userId,
      message: args.message,
    });
  },
} as const;
