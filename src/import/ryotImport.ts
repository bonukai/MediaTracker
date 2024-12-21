import _ from 'lodash';
import { z } from 'zod';

import {
  ImportDataType,
  ImportListItem,
  ImportRatingItem,
  ImportSeenHistoryItem,
  ImportWatchlistItem,
} from '../repository/importRepository.js';
import { parseISO } from 'date-fns';
import { itemTypeSchema } from '../entity/mediaItemModel.js';

export const ryotImport = {
  map(json: string): ImportDataType {
    const { media } = ryotExportSchema.parse(JSON.parse(json));

    const lists = _.uniq(
      media
        .filter((item) => item.collections.length > 0)
        .flatMap((item) => item.collections)
        .filter((collection) => collection !== 'Watchlist')
    );

    return {
      seenHistory: media
        .filter((item) => item.seen_history.length > 0)
        .flatMap((item) =>
          item.seen_history.map((history) => {
            const isEpisode =
              item.lot === 'tv' &&
              typeof history.show_season_number === 'number' &&
              typeof history.show_episode_number === 'number';

            return <ImportSeenHistoryItem>{
              itemType: isEpisode ? 'episode' : item.lot,
              title: item.source_id,
              ...toExternalId(item.source, item.identifier),
              seenAt: history.ended_on,
              episode: isEpisode
                ? {
                    seasonNumber: history.show_season_number,
                    episodeNumber: history.show_episode_number,
                  }
                : undefined,
            };
          })
        ),
      ratings: media
        .filter((item) => item.reviews.length > 0)
        .map((item) => {
          const review = item.reviews.at(-1)!;

          const isEpisode =
            item.lot === 'tv' &&
            typeof review.show_season_number === 'number' &&
            typeof review.show_episode_number === 'number';

          return <ImportRatingItem>{
            itemType: isEpisode ? 'episode' : item.lot,
            title: item.source_id,
            ...toExternalId(item.source, item.identifier),
            rating:
              typeof review.rating === 'number'
                ? review.rating / 10
                : undefined,
            episode: isEpisode
              ? {
                  seasonNumber: review.show_season_number,
                  episodeNumber: review.show_episode_number,
                }
              : undefined,
          };
        }),
      watchlist: media
        .filter((item) => item.collections.includes('Watchlist'))
        .filter((item) => itemTypeSchema.options.includes(item.lot as any))
        .map(
          (item) =>
            <ImportWatchlistItem>{
              itemType: item.lot,
              title: item.source_id,
              ...toExternalId(item.source, item.identifier),
            }
        ),
      lists: lists.map(
        (listName) =>
          <ImportListItem>{
            name: listName,
            items: media
              .filter((item) => item.collections.includes(listName))
              .map((item) => ({
                itemType: item.lot,
                title: item.source_id,
                ...toExternalId(item.source, item.identifier),
              })),
          }
      ),
    };
  },
};

const ryotExportSchema = z.object({
  media: z.array(
    z.object({
      lot: z
        .enum([
          'movie',
          'book',
          'anime',
          'show',
          'video_game',
          'podcast',
          'visual_novel',
          'manga',
          'audio_book',
        ])
        .transform((value) => {
          if (value === 'show') {
            return 'tv';
          } else if (value === 'audio_book') {
            return 'audiobook';
          }
          return value;
        }),
      source_id: z.string(),
      source: z.enum([
        'tmdb',
        'custom',
        'itunes',
        'anilist',
        'igdb',
        'vndb',
        'openlibrary',
        'google_books',
        'mal',
        'manga_updates',
        'audible',
      ]),
      identifier: z.string(),
      seen_history: z.array(
        z.object({
          progress: z.coerce.number(),
          ended_on: z
            .string()
            .transform((value) => parseISO(value))
            .optional(),
          show_season_number: z.number().optional(),
          show_episode_number: z.number().optional(),
          provider_watched_on: z.string().optional(),
        })
      ),
      reviews: z.array(
        z.object({
          review: z.object({
            visibility: z.string(),
            date: z.string().transform((value) => parseISO(value)),
            spoiler: z.boolean(),
          }),
          comments: z
            .array(
              z.object({
                id: z.string(),
                text: z.string(),
                user: z.object({ id: z.string(), name: z.string() }),
                liked_by: z.array(z.string()),
                created_on: z.string(),
              })
            )
            .optional(),
          rating: z.coerce.number().optional(),
          show_season_number: z.number().optional(),
          show_episode_number: z.number().optional(),
          anime_episode_number: z.number().optional(),
        })
      ),
      collections: z.array(z.string()),
    })
  ),
});

const toExternalId = (source: string, identifier: string) => {
  if (source === 'tmdb') {
    return { tmdbId: parseInt(identifier) };
  } else if (source === 'imdb') {
    return { igdbId: identifier };
  } else if (source === 'tvmaze') {
    return { igdbId: parseInt(identifier) };
  } else if (source === 'trakt') {
    return { igdbId: parseInt(identifier) };
  } else if (source === 'goodreads') {
    return { igdbId: parseInt(identifier) };
  } else if (source === 'igdb') {
    return { igdbId: parseInt(identifier) };
  } else if (source === 'openlibrary') {
    return { openlibraryId: identifier };
  } else if (source === 'audible') {
    return { audibleId: identifier };
  }
};
