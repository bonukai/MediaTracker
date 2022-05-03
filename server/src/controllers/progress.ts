import _ from 'lodash';
import { createExpressRoute } from 'typescript-routes-to-openapi-server';

import { tvEpisodeRepository } from 'src/repository/episode';
import { mediaItemRepository } from 'src/repository/mediaItem';
import { Seen } from 'src/entity/seen';
import { seenRepository } from 'src/repository/seen';
import { listItemRepository } from 'src/repository/listItemRepository';

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
    requestQuery: Omit<Seen, 'id' | 'userId' | 'type'>;
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

    await seenRepository.create({
      userId: userId,
      action: action,
      type: 'progress',
      date: date,
      duration: duration,
      episodeId: episodeId,
      mediaItemId: mediaItemId,
      progress: progress,
    });

    if (progress === 1 && episodeId == undefined) {
      await listItemRepository.removeItem({
        userId: userId,
        mediaItemId: mediaItemId,
        watchlist: true,
      });
      await seenRepository.create({
        userId: userId,
        action: action,
        type: 'seen',
        date: date,
        duration: duration,
        episodeId: episodeId,
        mediaItemId: mediaItemId,
        progress: progress,
      });
    } else {
      await listItemRepository.addItem({
        userId: userId,
        mediaItemId: mediaItemId,
        watchlist: true,
      });
    }

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
