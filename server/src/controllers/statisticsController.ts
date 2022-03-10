import _ from 'lodash';
import { createExpressRoute } from 'typescript-routes-to-openapi-server';

import { Database } from 'src/dbconfig';
import { MediaType } from 'src/entity/mediaItem';

/**
 * @openapi_tags Statistics
 */
export class StatisticsController {
  /**
   * @openapi_operationId summary
   */
  add = createExpressRoute<{
    method: 'get';
    path: '/api/statistics/summary';
    responseBody: StatisticsSummaryResponse;
  }>(async (req, res) => {
    const userId = Number(req.user);
    const statistics = await userStatisticsSummary(userId);
    res.send(statistics);
  });
}

type StatisticsSummaryResponse = {
  [Key in MediaType]: {
    numberOfPages?: number;
    duration: number;
    episodes: number;
    items: number;
    plays: number;
  };
};

export const userStatisticsSummary = async (userId: number) => {
  const res = await Database.knex('seen')
    .sum({
      runtime: Database.knex.raw(`CASE
                           WHEN "episode"."runtime" IS NOT NULL THEN "episode"."runtime"
                           ELSE "mediaItem"."runtime"
                         END 
                         * 
                         CASE
                           WHEN "seen"."type" = 'seen' THEN 1
                           ELSE "seen"."progress"
                         END`),
      numberOfPages: Database.knex.raw(`CASE
                                 WHEN "mediaItem"."numberOfPages" IS NOT NULL THEN "mediaItem"."numberOfPages"
                                 ELSE 0
                               END
                               * 
                               CASE
                                 WHEN "seen"."type" = 'seen' THEN 1
                                 ELSE "seen"."progress"
                               END`),
      duration: Database.knex.raw(`CASE
                            WHEN "seen"."duration" IS NOT NULL THEN "seen"."duration"
                            ELSE 0
                          END `),
    })
    .select('mediaItem.mediaType')
    .count({
      episodes: Database.knex.raw('DISTINCT "episode"."id"'),
      items: Database.knex.raw('DISTINCT "mediaItem"."id"'),
      plays: '*',
    })
    .where('userId', userId)
    .leftJoin('mediaItem', 'mediaItem.id', 'seen.mediaItemId')
    .leftJoin('episode', 'episode.id', 'seen.episodeId')
    .groupBy('mediaItem.mediaType');

  return _(res)
    .keyBy('mediaType')
    .mapValues((item) => ({
      ..._.omit(item, ['runtime', 'mediaType']),
      numberOfPages: Math.round(item.numberOfPages),
      duration: Math.round(
        item.mediaType === 'video_game' || item.mediaType === 'book'
          ? item.duration
          : item.runtime
      ),
    }))
    .value() as StatisticsSummaryResponse;
};
