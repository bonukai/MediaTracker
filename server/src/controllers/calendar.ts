import _ from 'lodash';

import { MediaItemItemsResponse, MediaItemBase } from 'src/entity/mediaItem';
import { TvEpisode } from 'src/entity/tvepisode';
import { Watchlist } from 'src/entity/watchlist';
import { getItemsKnex } from 'src/knex/queries/items';
import { createExpressRoute } from 'typescript-routes-to-openapi-server';
import { knex } from 'src/dbconfig';
import { Seen } from 'src/entity/seen';

/**
 * @openapi_tags Calendar
 */
export class CalendarController {
  /**
   * @openapi_operationId get
   */
  get = createExpressRoute<{
    method: 'get';
    path: '/api/calendar';
    requestQuery: {
      start?: string;
      end?: string;
    };
    responseBody: {
      episodes: TvEpisode[];
      items: MediaItemItemsResponse[];
    };
  }>(async (req, res) => {
    const userId = Number(req.user);

    const { start, end } = req.query;

    const episodes = (await knex<TvEpisode>('episode')
      .select('*')
      .select({
        seen: 'seen.episodeId',
      })
      .innerJoin<Watchlist>(
        (qb) =>
          qb
            .from<Watchlist>('watchlist')
            .where('userId', userId)
            .as('watchlist'),
        'watchlist.mediaItemId',
        'episode.tvShowId'
      )
      .leftJoin<Seen>(
        (qb) =>
          qb
            .distinct('mediaItemId', 'episodeId')
            .from<Seen>('seen')
            .where('userId', userId)
            .as('seen'),
        'seen.episodeId',
        'episode.id'
      )
      .whereBetween('releaseDate', [start, end])
      .where('isSpecialEpisode', false)
      .orderBy('seasonNumber', 'asc')
      .orderBy('episodeNumber', 'asc')) as TvEpisode[];

    const tvShows = await getItemsKnex({
      userId: userId,
      mediaItemIds: episodes.map((episode) => episode.tvShowId),
    });

    const tvShowsMap = _.mapKeys(tvShows, (tvShow) => tvShow.id);

    const mediaItems = (await knex<MediaItemBase>('mediaItem')
      .leftJoin<Watchlist>(
        (qb) =>
          qb
            .select('mediaItemId')
            .from<Watchlist>('watchlist')
            .where('userId', userId)
            .as('watchlist'),
        'watchlist.mediaItemId',
        'mediaItem.id'
      )
      .leftJoin<Seen>(
        (qb) =>
          qb
            .select('mediaItemId')
            .from<Seen>('seen')
            .where('userId', userId)
            .as('seen'),
        'seen.mediaItemId',
        'mediaItem.id'
      )
      .where((qb) =>
        qb
          .whereNotNull('watchlist.mediaItemId')
          .orWhereNotNull('seen.mediaItemId')
      )
      .whereNot('mediaType', 'tv')
      .whereBetween('releaseDate', [start, end])) as MediaItemBase[];

    res.send({
      episodes: episodes.map((episode) => ({
        ...episode,
        tvShow: tvShowsMap[episode.tvShowId],
        seen: Boolean(episode.seen),
      })),
      items: await getItemsKnex({
        userId: userId,
        mediaItemIds: mediaItems.map((mediaItem) => mediaItem.id),
      }),
    });
  });
}
