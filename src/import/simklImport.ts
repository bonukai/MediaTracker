import { z } from 'zod';

import {
  ImportDataType,
  ImportRatingItem,
  ImportSeenHistoryItem,
  ImportWatchlistItem,
} from '../repository/importRepository.js';
import { isDefined } from '../utils.js';

export const simklImport = {
  map: (json: string): ImportDataType => {
    const simklExport = simklExportSchema.parse(JSON.parse(json));

    const withUserRating = <T extends { user_rating?: number | null }>(
      item: T
    ): item is T & { user_rating: number } => {
      return isDefined(item.user_rating);
    };

    return {
      ratings: [
        ...simklExport.movies.filter(withUserRating).map(
          (item): ImportRatingItem => ({
            itemType: 'movie',
            title: item.movie.title,
            releaseYear: item.movie.year || undefined,
            imdbId: item.movie.ids.imdb,
            tmdbId: item.movie.ids.tmdb,
            rating: item.user_rating / 2,
          })
        ),
        ...simklExport.shows.filter(withUserRating).map(
          (item): ImportRatingItem => ({
            itemType: 'tv',
            title: item.show.title,
            releaseYear: item.show.year || undefined,
            imdbId: item.show.ids.imdb,
            tmdbId: item.show.ids.tmdb,
            tvdbId: item.show.ids.tvdb,
            rating: item.user_rating / 2,
          })
        ),
      ],
      seenHistory: [
        ...simklExport.movies
          .filter((item) => item.status === 'completed')
          .map(
            (item): ImportSeenHistoryItem => ({
              itemType: 'movie',
              title: item.movie.title,
              releaseYear: item.movie.year || undefined,
              seenAt: item.last_watched_at
                ? new Date(item.last_watched_at)
                : undefined,
              imdbId: item.movie.ids.imdb,
              tmdbId: item.movie.ids.tmdb,
            })
          ),
        ...simklExport.shows
          .flatMap(
            (show) =>
              show.seasons?.flatMap(
                (season) =>
                  season.episodes?.flatMap(
                    (episode): ImportSeenHistoryItem => ({
                      itemType: 'episode',
                      title: show.show.title,
                      releaseYear: show.show.year || undefined,
                      imdbId: show.show.ids.imdb,
                      tmdbId: show.show.ids.tmdb,
                      tvdbId: show.show.ids.tvdb,
                      episode: {
                        episodeNumber: episode.number,
                        seasonNumber: season.number,
                      },
                    })
                  )
              )
          )
          .filter(isDefined),
      ],
      watchlist: [
        ...simklExport.shows
          .filter((item) => item.status === 'plantowatch')
          .map(
            (item): ImportWatchlistItem => ({
              itemType: 'tv',
              title: item.show.title,
              releaseYear: item.show.year || undefined,
              imdbId: item.show.ids.imdb,
              tmdbId: item.show.ids.tmdb,
              tvdbId: item.show.ids.tvdb,
            })
          ),
        ...simklExport.movies
          .filter((item) => item.status === 'plantowatch')
          .map(
            (item): ImportWatchlistItem => ({
              itemType: 'movie',
              title: item.movie.title,
              releaseYear: item.movie.year || undefined,
              imdbId: item.movie.ids.imdb,
              tmdbId: item.movie.ids.tmdb,
            })
          ),
      ],
      lists: ['dropped', 'hold', 'watching'].map((list) => ({
        name: `Simkl-${list}`,
        items: [
          ...simklExport.shows
            .filter((item) => item.status === list)
            .map(
              (item): ImportWatchlistItem => ({
                itemType: 'tv',
                title: item.show.title,
                releaseYear: item.show.year || undefined,
                imdbId: item.show.ids.imdb,
                tmdbId: item.show.ids.tmdb,
                tvdbId: item.show.ids.tvdb,
              })
            ),
          ...simklExport.movies
            .filter((item) => item.status === list)
            .map(
              (item): ImportWatchlistItem => ({
                itemType: 'movie',
                title: item.movie.title,
                releaseYear: item.movie.year || undefined,
                imdbId: item.movie.ids.imdb,
                tmdbId: item.movie.ids.tmdb,
              })
            ),
        ],
      })),
    };
  },
};

const simlkStatusSchema = z.enum([
  'plantowatch',
  'watching',
  'completed',
  'hold',
  'dropped',
]);

const simklExportSchema = z.object({
  shows: z.array(
    z.object({
      last_watched_at: z.string().nullish(),
      status: simlkStatusSchema,
      user_rating: z.number().nullish(),
      last_watched: z.string().nullish(),
      next_to_watch: z.string().nullish(),
      watched_episodes_count: z.number().nullish(),
      total_episodes_count: z.number().nullish(),
      not_aired_episodes_count: z.number().nullish(),
      show: z.object({
        title: z.string(),
        poster: z.string().nullish(),
        year: z.number().nullish(),
        ids: z.object({
          simkl: z.number(),
          slug: z.string().nullish(),
          tmdb: z.coerce.number().nullish(),
          instagram: z.string().nullish(),
          tvdbslug: z.string().nullish(),
          fb: z.string().nullish(),
          tw: z.string().nullish(),
          imdb: z.string().nullish(),
          tvdb: z.coerce.number().nullish(),
        }),
      }),
      seasons: z
        .array(
          z.object({
            number: z.number(),
            episodes: z.array(z.object({ number: z.number() })),
          })
        )
        .nullish(),
    })
  ),
  movies: z.array(
    z.object({
      last_watched_at: z.string().nullish(),
      status: simlkStatusSchema,
      user_rating: z.number().nullish(),
      movie: z.object({
        title: z.string(),
        poster: z.string().nullish(),
        year: z.number().nullish(),
        ids: z.object({
          simkl: z.number(),
          slug: z.string().nullish(),
          tvdbmslug: z.string().nullish(),
          imdb: z.string().nullish(),
          tmdb: z.coerce.number().nullish(),
        }),
      }),
    })
  ),
});
