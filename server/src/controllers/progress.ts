import _ from 'lodash';
import { createExpressRoute } from 'typescript-routes-to-openapi-server';

import { tvEpisodeRepository } from 'src/repository/episode';
import { mediaItemRepository } from 'src/repository/mediaItem';
import { seenRepository } from 'src/repository/seen';
import { listItemRepository } from 'src/repository/listItemRepository';
import { MediaType } from 'src/entity/mediaItem';
import { findMediaItemOrEpisodeByExternalId } from 'src/metadata/findByExternalId';
import { logger } from 'src/logger';
import { Progress } from 'src/entity/progress';
import { Database } from 'src/dbconfig';
import { Seen } from 'src/entity/seen';

/**
 * @openapi_tags Progress
 */
export class ProgressController {
  /**
   * @openapi_operationId add
   */
  add = createExpressRoute<{
    method: 'put';
    path: '/api/progress';
    requestQuery: Omit<Progress, 'id' | 'userId'>;
  }>(async (req, res) => {
    const userId = Number(req.user);

    const { mediaItemId, episodeId, date, action, duration, progress } =
      req.query;

    if (progress != undefined && (progress < 0 || progress > 1)) {
      res.status(400);
      res.send('Progress should be between 0 and 1');
      return;
    }

    const mediaItem = await mediaItemRepository.findOne({
      id: mediaItemId,
    });

    if (!mediaItem || mediaItem.mediaType === 'tv') {
      res.send(400);
      return;
    }

    if (episodeId) {
      const episode = await tvEpisodeRepository.findOne({ id: episodeId });

      if (!episode) {
        res.send(400);
        return;
      }
    }

    await addItem({
      userId: userId,
      action: action,
      date: date,
      duration: duration,
      episodeId: episodeId,
      mediaItemId: mediaItemId,
      progress: progress,
    });

    res.send();
  });

  /**
   * @openapi_operationId addByExternalId
   */
  addByExternalId = createExpressRoute<{
    method: 'put';
    path: '/api/progress/by-external-id';
    requestBody: {
      mediaType: MediaType;
      id: {
        imdbId?: string;
        tmdbId?: number;
      };
      seasonNumber?: number;
      episodeNumber?: number;
      action?: 'paused' | 'playing';
      progress?: number;
      duration?: number;
      device?: string;
    };
  }>(async (req, res) => {
    const userId = Number(req.user);

    const {
      mediaType,
      id,
      seasonNumber,
      episodeNumber,
      action,
      duration,
      progress,
      device,
    } = req.body;

    if (progress != undefined && (progress < 0 || progress > 1)) {
      res.status(400);
      res.send('Progress should be between 0 and 1');
      return;
    }

    const { mediaItem, episode, error } =
      await findMediaItemOrEpisodeByExternalId({
        mediaType: mediaType,
        id: id,
        seasonNumber: seasonNumber,
        episodeNumber: episodeNumber,
      });

    if (error) {
      res.status(400);
      res.send(error);
      return;
    }

    if (mediaType === 'tv') {
      await addItem({
        userId: userId,
        action: action,
        date: Date.now(),
        duration: duration,
        episodeId: episode.id,
        mediaItemId: mediaItem.id,
        progress: progress,
        device: device,
      });
    } else {
      await addItem({
        userId: userId,
        action: action,
        date: Date.now(),
        duration: duration,
        mediaItemId: mediaItem.id,
        progress: progress,
        device: device,
      });
    }

    res.send();
  });

  /**
   * @openapi_operationId addByAudibleId
   */
   addByAudibleId = createExpressRoute<{
    method: 'put';
    path: '/api/progress/by-audible-id/:audibleId';
    pathParams: {
      audibleId: string;
    };
    requestBody: {
      action?: 'paused' | 'playing';
      progress?: number;
      duration?: number;
      device?: string;
    };
  }>(async (req, res) => {
    const userId = Number(req.user);
    const { audibleId } = req.params;
    const { action, progress, duration, device } = req.body;

      if (progress != undefined && (progress < 0 || progress > 1)) {
        res.status(400);
        res.send('Progress should be between 0 and 1');
        return;
      }

    const mediaItem = await mediaItemRepository.findByAudibleId(audibleId);

    if (!mediaItem) {
      res.status(404);
      res.send('Audiobook not found');
      return;
    }

    if (mediaItem.mediaType !== 'audiobook') {
      res.status(400);
      res.send('The provided Audible ID is not associated with an audiobook');
      return;
    }

    await addItem({
      userId: userId,
      action: action,
      date: Date.now(),
      duration: duration,
      mediaItemId: mediaItem.id,
      progress: progress,
      device: device,
    });

    res.send();
  });
    
    
  /**
   * @openapi_operationId deleteById
   */
  deleteById = createExpressRoute<{
    method: 'delete';
    path: '/api/progress/:progressId';
    pathParams: {
      progressId: number;
    };
  }>(async (req, res) => {
    const { progressId } = req.params;

    await seenRepository.delete({
      id: progressId,
    });

    res.send();
  });
}

const addItem = async (args: Progress) => {
  logger.debug(`added progress ${JSON.stringify(args)}`);

  if (args.progress === 1) {
    await Database.knex.transaction(async (trx) => {
      await trx<Progress>('progress')
        .where({
          userId: args.userId,
          mediaItemId: args.mediaItemId,
          episodeId: args.episodeId || null,
        })
        .delete();

      await trx<Seen>('seen').insert({
        userId: args.userId,
        mediaItemId: args.mediaItemId,
        episodeId: args.episodeId || null,
        date: Date.now(),
        duration: args.duration,
      });
    });
  } else {
    await Database.knex.transaction(async (trx) => {
      const currentProgress = await trx<Progress>('progress')
        .where({
          userId: args.userId,
          mediaItemId: args.mediaItemId,
          episodeId: args.episodeId || null,
        })
        .first();

      if (currentProgress) {
        await trx<Progress>('progress').where('id', currentProgress.id).update({
          action: args.action,
          date: Date.now(),
          duration: args.duration,
          progress: args.progress,
          device: args.device,
        });
      } else {
        await trx<Progress>('progress').insert({
          userId: args.userId,
          action: args.action,
          date: Date.now(),
          duration: args.duration,
          mediaItemId: args.mediaItemId,
          episodeId: args.episodeId || null,
          progress: args.progress,
          device: args.device,
        });
      }
    });
  }

  if (args.progress === 1 && args.episodeId == undefined) {
    await listItemRepository.removeItem({
      userId: args.userId,
      mediaItemId: args.mediaItemId,
      watchlist: true,
    });
  }
};
