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

  private async get<T>(url: string) {
    return await axios.get<T>(url, {
      headers: {
        'Content-type': 'application/json',
        'trakt-api-version': 2,
        'trakt-api-key': CLIENT_ID,
        Authorization: `Bearer ${this.deviceToken.access_token}`,
      },
    });
  }

  async export() {
    if (!this.deviceToken) {
      throw new Error('No device token');
    }

    const watchlistResponse = await this.get<TraktApi.WatchlistResponse>(
      'https://api.trakt.tv/sync/watchlist'
    );

    const historyResponse = await this.get<TraktApi.HistoryResponse>(
      'https://api.trakt.tv/sync/history'
    );

    const ratingResponse = await this.get<TraktApi.RatingResponse>(
      'https://api.trakt.tv/sync/ratings'
    );

    return {
      watchlist: watchlistResponse.data,
      history: historyResponse.data,
      rating: ratingResponse.data,
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
    type: 'movie' | 'show';
    movie: MovieResponse;
    show: ShowResponse;
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
    type: 'episode' | 'season' | 'episode';
    episode: EpisodeResponse;
    show: ShowResponse;
    season: SeasonResponse;
    movie: MovieResponse;
  }>;
}
