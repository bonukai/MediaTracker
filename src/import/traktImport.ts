import { addSeconds } from 'date-fns';
import { z } from 'zod';

import { ImportDataType } from '../repository/importRepository.js';

const CLIENT_ID =
  'b3d93fd4c53d78d61b18e0f0bf7ad5153de323788dbc0be1a3627205a36e89f5';

const CLIENT_SECRET =
  '4274a0fcefea5877bb94323033fe945a65528c2112411cadc091bb164173c377';

const traktDeviceCodeResponseSchema = z.object({
  device_code: z.string(),
  user_code: z.string(),
  verification_url: z.string(),
  expires_in: z.number(),
  interval: z.number(),
});

const traktDeviceTokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  refresh_token: z.string(),
  scope: z.string(),
  created_at: z.number(),
});

const traktEpisodeSchema = z.object({
  title: z.string(),
  season: z.number(),
  number: z.number(),
  ids: z.object({
    trakt: z.number(),
    imdb: z.string().nullish(),
    tmdb: z.number().nullish(),
    tvdb: z.number().nullish(),
    tvrage: z.number().nullish(),
  }),
});

const traktShowSchema = z.object({
  title: z.string(),
  year: z.number().nullish(),
  ids: z.object({
    trakt: z.number(),
    slug: z.string().nullish(),
    imdb: z.string().nullish(),
    tmdb: z.number().nullish(),
    tvdb: z.number().nullish(),
    tvrage: z.number().nullish(),
  }),
});

const traktMovieSchema = z.object({
  title: z.string(),
  year: z.number().nullish(),
  ids: z.object({
    trakt: z.number(),
    slug: z.string(),
    imdb: z.string().nullish(),
    tmdb: z.number().nullish(),
  }),
});

const traktSeasonSchema = z.object({
  number: z.number(),
  ids: z.object({
    trakt: z.number(),
    tmdb: z.number().nullish(),
    tvdb: z.number().nullish(),
    tvrage: z.number().nullish(),
  }),
});

const traktItemTypeSchema = z.enum(['movie', 'show', 'episode', 'season']);

const traktWatchlistItemSchema = z.array(
  z.object({
    rank: z.number(),
    id: z.number(),
    listed_at: z.string(),
    notes: z.string().nullish(),
    type: traktItemTypeSchema,
    movie: traktMovieSchema.optional(),
    show: traktShowSchema.optional(),
    episode: traktEpisodeSchema.optional(),
    season: traktSeasonSchema.optional(),
  })
);

const traktHistorySchema = z.array(
  z.object({
    id: z.number(),
    watched_at: z.string(),
    action: z.enum(['watch', 'scrobble', 'checkin']),
    type: z.enum(['movie', 'episode']),
    movie: traktMovieSchema.optional(),
    show: traktShowSchema.optional(),
    episode: traktEpisodeSchema.optional(),
  })
);

const traktRatingSchema = z.array(
  z.object({
    rating: z.number(),
    rated_at: z.string(),
    type: traktItemTypeSchema,
    movie: traktMovieSchema.optional(),
    show: traktShowSchema.optional(),
    episode: traktEpisodeSchema.optional(),
    season: traktSeasonSchema.optional(),
  })
);

const traktListsSchema = z.array(
  z.object({
    name: z.string(),
    description: z.string(),
    privacy: z.enum(['private', 'public', 'link', 'friends']),
    display_numbers: z.boolean(),
    allow_comments: z.boolean(),
    sort_by: z.string(),
    sort_how: z.enum(['asc', 'desc']),
    created_at: z.string(),
    updated_at: z.string(),
    item_count: z.number(),
    comment_count: z.number(),
    likes: z.number(),
    ids: z.object({
      trakt: z.number(),
      slug: z.string(),
    }),
  })
);

const TraktImporter = {
  async getUserCode() {
    const res = await fetch('https://api.trakt.tv/oauth/device/code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: CLIENT_ID }),
    });

    const data = traktDeviceCodeResponseSchema.parse(await res.json());
    const expiresAt = addSeconds(new Date(), data.expires_in);

    const getAccessToken = async () => {
      return new Promise<string>((resolve) => {
        const handler = async () => {
          if (new Date() > expiresAt) {
            clearInterval(interval);
          }

          const res = await fetch('https://api.trakt.tv/oauth/device/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: data.device_code,
              client_secret: CLIENT_SECRET,
              client_id: CLIENT_ID,
            }),
          });

          if (res.status !== 200) {
            return;
          }

          const accessToken = traktDeviceTokenResponseSchema.parse(
            await res.json()
          );

          clearInterval(interval);

          resolve(accessToken.access_token);
        };

        const interval = setInterval(handler, data.interval * 1000);
      });
    };

    const exportData = async (): Promise<ImportDataType> => {
      const accessToken = await getAccessToken();

      const fetchOptions = {
        headers: {
          'Content-type': 'application/json',
          'trakt-api-version': '2',
          'trakt-api-key': CLIENT_ID,
          Authorization: `Bearer ${accessToken}`,
        },
      };

      const history = await exportHistory(fetchOptions);
      const watchlist = await exportWatchlist(fetchOptions);
      const ratings = await exportRatings(fetchOptions);
      const lists = await exportLists(fetchOptions);

      return {
        seenHistory: history.map((item) => ({
          itemType: item.type,
          title: item.movie?.title || item.show?.title,
          releaseYear: item.movie?.year || item.show?.year || undefined,
          imdbId: item.movie?.ids?.imdb || item.show?.ids?.imdb,
          tmdbId: item.movie?.ids?.tmdb || item.show?.ids?.tmdb,
          tvdbId: item.show?.ids?.tvdb,
          episode: item.episode
            ? {
                episodeNumber: item.episode.number,
                seasonNumber: item.episode.season,
                imdbId: item.episode.ids.imdb,
                tmdbId: item.episode.ids.tmdb,
                tvdb: item.episode.ids.tvdb,
              }
            : undefined,
        })),
        ratings: ratings.map((item) => ({
          itemType: item.type === 'show' ? 'tv' : item.type,
          title: item.movie?.title || item.show?.title,
          releaseYear: item.movie?.year || item.show?.year || undefined,
          rating: item.rating / 2,
          ratedAt: new Date(item.rated_at),
          imdbId: item.movie?.ids?.imdb || item.show?.ids?.imdb,
          tmdbId: item.movie?.ids?.tmdb || item.show?.ids?.tmdb,
          tvdbId: item.show?.ids?.tvdb,
          episode: item.episode
            ? {
                episodeNumber: item.episode.number,
                seasonNumber: item.episode.season,
                imdbId: item.episode.ids.imdb,
                tmdbId: item.episode.ids.tmdb,
                tvdb: item.episode.ids.tvdb,
              }
            : undefined,
          season: item.season
            ? {
                seasonNumber: item.season.number,
                tmdbId: item.season.ids.tmdb,
                tvdb: item.season.ids.tvdb,
              }
            : undefined,
        })),
        watchlist: watchlist.map((item) => ({
          itemType: item.type === 'show' ? 'tv' : item.type,
          title: item.movie?.title || item.show?.title,
          releaseYear: item.movie?.year || item.show?.year || undefined,
          addedAt: new Date(item.listed_at),
          imdbId: item.movie?.ids?.imdb || item.show?.ids?.imdb,
          tmdbId: item.movie?.ids?.tmdb || item.show?.ids?.tmdb,
          tvdbId: item.show?.ids?.tvdb,
          episode: item.episode
            ? {
                episodeNumber: item.episode.number,
                seasonNumber: item.episode.season,
                imdbId: item.episode.ids.imdb,
                tmdbId: item.episode.ids.tmdb,
                tvdb: item.episode.ids.tvdb,
              }
            : undefined,
          season: item.season
            ? {
                seasonNumber: item.season.number,
                tmdbId: item.season.ids.tmdb,
                tvdb: item.season.ids.tvdb,
              }
            : undefined,
        })),
        lists: lists.map((item) => ({
          name: `Trakt-${item.name}`,
          description: item.description,
          traktId: item.ids.trakt,
          items: item.items.map((listItem) => ({
            itemType: listItem.type === 'show' ? 'tv' : listItem.type,
            title: listItem.movie?.title || listItem.show?.title,
            releaseYear:
              listItem.movie?.year || listItem.show?.year || undefined,
            addedAt: new Date(listItem.listed_at),
            imdbId: listItem.movie?.ids?.imdb || listItem.show?.ids?.imdb,
            tmdbId: listItem.movie?.ids?.tmdb || listItem.show?.ids?.tmdb,
            tvdbId: listItem.show?.ids?.tvdb,
            episode: listItem.episode
              ? {
                  episodeNumber: listItem.episode.number,
                  seasonNumber: listItem.episode.season,
                  imdbId: listItem.episode.ids.imdb,
                  tmdbId: listItem.episode.ids.tmdb,
                  tvdb: listItem.episode.ids.tvdb,
                }
              : undefined,
            season: listItem.season
              ? {
                  seasonNumber: listItem.season.number,
                  tmdbId: listItem.season.ids.tmdb,
                  tvdb: listItem.season.ids.tvdb,
                }
              : undefined,
          })),
        })),
      };
    };

    return {
      userCode: data.user_code,
      export: exportData,
    };
  },
};

const exportHistory = async (fetchOptions: any) => {
  const result = new Array<z.infer<typeof traktHistorySchema>[number]>();

  let page = 1;
  let pageCount: number | undefined = undefined;

  do {
    const historyResponse = await fetch(
      'https://api.trakt.tv/sync/history?' +
        new URLSearchParams({
          page: `${page++}`,
          limit: `${1000}`,
        }),
      fetchOptions
    );

    pageCount = Number(historyResponse.headers.get('x-pagination-page-count'));
    result.push(...traktHistorySchema.parse(await historyResponse.json()));
  } while (page <= pageCount);

  return result;
};

const exportWatchlist = async (fetchOptions: any) => {
  const res = await fetch('https://api.trakt.tv/sync/watchlist', fetchOptions);
  return traktWatchlistItemSchema.parse(await res.json());
};

const exportRatings = async (fetchOptions: any) => {
  const res = await fetch('https://api.trakt.tv/sync/ratings', fetchOptions);
  return traktRatingSchema.parse(await res.json());
};

const exportLists = async (fetchOptions: any) => {
  const listsResponse = await fetch(
    'https://api.trakt.tv/users/me/lists',
    fetchOptions
  );

  const lists = traktListsSchema.parse(await listsResponse.json());

  return await Promise.all(
    lists.map(async (list) => {
      const listItemsResponse = await fetch(
        `https://api.trakt.tv/users/me/lists/${list.ids.slug}/items`,
        fetchOptions
      );

      const listItems = traktWatchlistItemSchema.parse(
        await listItemsResponse.json()
      );

      return {
        ...list,
        items: listItems,
      };
    })
  );
};
