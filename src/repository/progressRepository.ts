import { Database } from '../database.js';

export const progressRepository = {
  async set(args: {
    mediaItemId: number;
    episodeId: number | null;
    userId: number;
    progress: number;
    duration?: number | null;
    device?: string | null;
    action?: 'playing' | 'paused' | null;
  }) {
    const {
      userId,
      mediaItemId,
      episodeId,
      progress,
      device,
      action,
      duration,
    } = args;

    await Database.knex.transaction(async (trx) => {
      await trx('progress')
        .where('userId', userId)
        .where('mediaItemId', mediaItemId)
        .where('episodeId', episodeId)
        .delete();

      await trx('progress').insert({
        userId,
        mediaItemId,
        episodeId,
        action,
        device,
        progress,
        duration,
        date: new Date().getTime(),
      });
    });
  },
  async remove(args: {
    userId: number;
    mediaItemId: number;
    episodeId?: number | null;
  }) {
    const { userId, mediaItemId, episodeId } = args;
    await Database.knex('progress')
      .where('userId', userId)
      .where('mediaItemId', mediaItemId)
      .where('episodeId', episodeId)
      .delete();
  },
} as const;
