import _ from 'lodash';
import { z } from 'zod';

import {
  ImportDataType,
  ImportSeenHistoryItem,
} from '../repository/importRepository.js';
import { withDefinedPropertyFactory } from '../utils.js';

export const floxImport = {
  map(json: string): ImportDataType {
    const res = floxExportSchema.parse(JSON.parse(json));

    const tmdbTitleMap = _(res.items)
      .filter(withDefinedPropertyFactory('tmdb_id'))
      .map((item) => item.title);

    return {
      watchlist: res.items
        .filter((item) => item.watchlist)
        .map((item) => ({
          itemType: item.media_type,
          title: item.title,
          tmdbId: item.tmdb_id,
          imdbId: item.imdb_id,
        })),
      ratings: res.items
        .filter((item) => item.rating !== '0')
        .map((item) => ({
          itemType: item.media_type,
          title: item.title,
          tmdbId: item.tmdb_id,
          imdbId: item.imdb_id,
          rating: item.rating === '1' ? 1 : item.rating === '2' ? 2.5 : 5,
        })),
      seenHistory: [
        ...res.items
          .filter(withDefinedPropertyFactory('last_seen_at'))
          .filter((item) => item.media_type === 'movie')
          .map(
            (item): ImportSeenHistoryItem => ({
              itemType: 'movie',
              title: item.title,
              tmdbId: item.tmdb_id,
              imdbId: item.imdb_id,
              seenAt: new Date(item.last_seen_at),
            })
          ),
        ...res.episodes
          .filter((item) => item.seen)
          .filter((item) => item.tmdb_id && tmdbTitleMap.get(item.tmdb_id))
          .map(
            (item): ImportSeenHistoryItem => ({
              itemType: 'episode',
              tmdbId: item.tmdb_id,
              title: item.tmdb_id ? tmdbTitleMap.get(item.tmdb_id) : undefined,
              episode: {
                episodeNumber: item.episode_number,
                seasonNumber: item.season_number,
                tmdbId: item.episode_tmdb_id,
              },
            })
          ),
      ],
    };
  },
};

const floxExportSchema = z.object({
  items: z.array(
    z.object({
      tmdb_id: z.number().nullable(),
      title: z.string(),
      media_type: z.enum(['movie', 'tv']),
      rating: z.enum(['0', '1', '2', '3']),
      last_seen_at: z.string().nullable(),
      imdb_id: z.string().nullable(),
      watchlist: z.coerce.boolean(),
      startDate: z.string().nullable(),
    })
  ),
  episodes: z.array(
    z.object({
      tmdb_id: z.number().nullable(),
      name: z.string(),
      season_number: z.number(),
      season_tmdb_id: z.number().nullable(),
      episode_number: z.number(),
      episode_tmdb_id: z.number().nullable(),
      seen: z.coerce.boolean(),
      startDate: z.string().nullable(),
    })
  ),
});
