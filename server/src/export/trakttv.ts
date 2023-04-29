import axios from 'axios';

const CLIENT_ID =
  'b3d93fd4c53d78d61b18e0f0bf7ad5153de323788dbc0be1a3627205a36e89f5';

const CLIENT_SECRET =
  '4274a0fcefea5877bb94323033fe945a65528c2112411cadc091bb164173c377';

export class TraktTvExport {
  private deviceCode: TraktApi.DeviceCodeResponse;
  private deviceToken: TraktApi.DeviceTokenResponse;
  private deviceCodeAcquiredAt: Date;

  private hasDeviceCodeExpired() {
    return (
      new Date().getTime() >
      this.deviceCodeAcquiredAt?.getTime() + this.deviceCode?.expires_in * 1000
    );
  }

  async authenticate(onAuthenticated: (deviceCode: string) => Promise<void>) {
    if (!this.deviceCode || this.hasDeviceCodeExpired()) {
      this.deviceToken = undefined;

      const res = await axios.post<TraktApi.DeviceCodeResponse>(
        'https://api.trakt.tv/oauth/device/code',
        {
          client_id: CLIENT_ID,
        }
      );

      this.deviceCode = res.data;
      this.deviceCodeAcquiredAt = new Date();

      const handler = async () => {
        try {
          const res = await axios.post<TraktApi.DeviceTokenResponse>(
            'https://api.trakt.tv/oauth/device/token',
            {
              code: this.deviceCode.device_code,
              client_secret: CLIENT_SECRET,
              client_id: CLIENT_ID,
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
          this.deviceToken = res.data;
          clearInterval(interval);
          await onAuthenticated(this.deviceCode.user_code);

          // eslint-disable-next-line no-empty
        } catch (error) {}
      };

      const interval = setInterval(handler, this.deviceCode.interval * 1000);
    }

    return {
      userCode: this.deviceCode.user_code,
      verificationUrl: this.deviceCode.verification_url,
      expiresAt: new Date(
        new Date().getTime() + this.deviceCode.expires_in * 1000
      ),
    };
  }

  public isAuthenticated() {
    return this.deviceToken !== undefined;
  }

  private headers() {
    return {
      'Content-type': 'application/json',
      'trakt-api-version': 2,
      'trakt-api-key': CLIENT_ID,
      Authorization: `Bearer ${this.deviceToken.access_token}`,
    };
  }

  private async getHistory() {
    const result: TraktApi.HistoryResponse = [];

    const limit = 1000;

    let page = 1;
    let pageCount: number = undefined;

    do {
      const historyResponse = await axios.get<TraktApi.HistoryResponse>(
        'https://api.trakt.tv/sync/history',
        {
          headers: this.headers(),
          data: {
            page: page++,
            limit: limit,
          },
        }
      );

      pageCount = Number(historyResponse.headers['x-pagination-page-count']);

      result.push(...historyResponse.data);
    } while (page <= pageCount);

    return result;
  }

  async export() {
    if (!this.deviceToken) {
      throw new Error('No device token');
    }

    const watchlistResponse = await axios.get<TraktApi.WatchlistResponse>(
      'https://api.trakt.tv/sync/watchlist',
      { headers: this.headers() }
    );

    const historyResponse = await this.getHistory();

    const ratingResponse = await axios.get<TraktApi.RatingResponse>(
      'https://api.trakt.tv/sync/ratings',
      { headers: this.headers() }
    );

    const listsResponse = await axios.get<TraktApi.ListsResponse>(
      'https://api.trakt.tv/users/me/lists',
      { headers: this.headers() }
    );

    const listsItems = new Map<string, TraktApi.ListItemsResponse>();

    for (const list of listsResponse.data) {
      const listItemsResponse = await axios.get<TraktApi.ListItemsResponse>(
        `https://api.trakt.tv/users/me/lists/${list.ids.slug}/items`,
        { headers: this.headers() }
      );

      listsItems.set(list.ids.slug, listItemsResponse.data);
    }

    return {
      watchlist: watchlistResponse.data,
      history: historyResponse,
      rating: ratingResponse.data,
      lists: listsResponse.data,
      listsItems,
    };
  }
}

export namespace TraktApi {
  export type DeviceCodeResponse = {
    device_code: string;
    user_code: string;
    verification_url: string;
    expires_in: number;
    interval: number;
  };

  export type DeviceTokenResponse = {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
    created_at: number;
  };

  export type MovieResponse = {
    title: string;
    year: number;
    ids: {
      trakt: number;
      slug: string;
      tvdb: number;
      imdb: string;
      tmdb: number;
      tvrage: number;
    };
  };

  export type ShowResponse = MovieResponse;

  export type EpisodeResponse = {
    season: number;
    number: number;
    title: string;
    ids: {
      trakt: number;
      tvdb: number;
      imdb: string;
      tmdb: number;
      tvrage: number;
    };
  };

  export type SeasonResponse = {
    number: number;
    ids: {
      trakt: number;
      tvdb: number;
      imdb: string;
      tmdb: number;
      tvrage: number;
    };
  };

  export type WatchlistResponse = Array<{
    rank: number;
    id: number;
    listed_at: string;
    notes?: string;
    type: 'movie' | 'show' | 'season' | 'episode';
    movie: MovieResponse;
    show: ShowResponse;
    episode: EpisodeResponse;
    season: SeasonResponse;
  }>;

  export type HistoryResponse = Array<{
    id: number;
    watched_at: string;
    action: 'watch' | 'checkin' | 'scrobble';
    type: 'episode' | 'movie';
    episode: EpisodeResponse;
    show: ShowResponse;
    movie: MovieResponse;
  }>;

  export type RatingResponse = Array<{
    rated_at: string;
    rating: number;
    type: 'movie' | 'show' | 'season' | 'episode';
    episode?: EpisodeResponse;
    show?: ShowResponse;
    season?: SeasonResponse;
    movie?: MovieResponse;
  }>;

  export type ListsResponse = Array<{
    name: string;
    description: string;
    privacy: 'public' | 'private' | 'friends';
    display_numbers: boolean;
    allow_comments: boolean;
    sort_by: 'runtime';
    sort_how: 'asc' | 'desc';
    created_at: string;
    updated_at: string;
    item_count: number;
    comment_count: number;
    likes: number;
    ids: {
      trakt: number;
      slug: string;
    };
    user: {
      username: string;
      private: boolean;
      name?: string;
      vip: boolean;
      vip_ep: boolean;
      ids: {
        slug: string;
      };
    };
  }>;

  export type ListItemsResponse = Array<{
    rank: number;
    id: number;
    listed_at: string;
    notes?: string;
    type: 'movie' | 'show' | 'season' | 'episode';
    episode?: EpisodeResponse;
    show?: ShowResponse;
    season?: SeasonResponse;
    movie?: MovieResponse;
  }>;
}
