/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface TvEpisode {
    id?: number | null;
    title: string;
    description?: string | null;
    episodeNumber: number;
    seasonNumber: number;
    releaseDate?: string | null;
    tvShowId?: number | null;
    seasonId?: number | null;
    tmdbId?: number | null;
    imdbId?: string | null;
    runtime?: number | null;
    seenHistory?: Seen[] | null;
    userRating?: UserRating | null;
    lastSeenAt?: number | null;
    seasonAndEpisodeNumber?: number | null;
    seen?: boolean | null;
    tvShow?: MediaItemItemsResponse | null;
    isSpecialEpisode: boolean;
}

export interface Seen {
    id?: number | null;
    date: number;
    mediaItemId: number;
    seasonId?: number | null;
    episodeId?: number | null;
    userId: number;
}

export interface UserRating {
    id?: number | null;
    mediaItemId: number;
    date: number;
    userId: number;
    rating?: number | null;
    review?: string | null;
    episodeId?: number | null;
    seasonId?: number | null;
}

export type MediaItemItemsResponse = {
    tmdbId?: number | null;
    imdbId?: string | null;
    tvmazeId?: number | null;
    igdbId?: number | null;
    openlibraryId?: string | null;
    audibleId?: string | null;
    id?: number | null;
    numberOfSeasons?: number | null;
    status?: string | null;
    platform?: string | null;
    title: string;
    originalTitle?: string | null;
    poster?: string | null;
    backdrop?: string | null;
    tmdbRating?: number | null;
    releaseDate?: string | null;
    overview?: string | null;
    lastTimeUpdated: number;
    source: string;
    network?: string | null;
    url?: string | null;
    runtime?: number | null;
    mediaType: MediaType;
    genres?: string[] | null;
    numberOfEpisodes?: number | null;
    developer?: string | null;
    authors?: string[] | null;
    narrators?: string[] | null;
    language?: string | null;
    needsDetails?: boolean | null;
} & {
    isSearchResult?: boolean | null;
    hasDetails?: boolean | null;
    poster?: string | null;
    posterSmall?: string | null;
    backdrop?: string | null;
    seenHistory?: Seen[] | null;
    unseenEpisodesCount?: number | null;
    userRating?: UserRating | null;
    upcomingEpisode?: TvEpisode | null;
    nextAiring?: string | null;
    onWatchlist?: boolean | null;
    lastSeenAt?: number | null;
    seen?: boolean | null;
    firstUnwatchedEpisode?: TvEpisode | null;
};

export type MediaType = 'audiobook' | 'book' | 'movie' | 'tv' | 'video_game';

export type ImgSize = 'original' | 'small';

export type MediaItemDetailsResponse = {
    tmdbId?: number | null;
    imdbId?: string | null;
    tvmazeId?: number | null;
    igdbId?: number | null;
    openlibraryId?: string | null;
    audibleId?: string | null;
    id?: number | null;
    numberOfSeasons?: number | null;
    status?: string | null;
    platform?: string | null;
    title: string;
    originalTitle?: string | null;
    poster?: string | null;
    backdrop?: string | null;
    tmdbRating?: number | null;
    releaseDate?: string | null;
    overview?: string | null;
    lastTimeUpdated: number;
    source: string;
    network?: string | null;
    url?: string | null;
    runtime?: number | null;
    mediaType: MediaType;
    genres?: string[] | null;
    numberOfEpisodes?: number | null;
    developer?: string | null;
    authors?: string[] | null;
    narrators?: string[] | null;
    language?: string | null;
    needsDetails?: boolean | null;
    seasons?: TvSeason[] | null;
} & {
    isSearchResult?: boolean | null;
    hasDetails?: boolean | null;
    poster?: string | null;
    posterSmall?: string | null;
    backdrop?: string | null;
    seenHistory?: Seen[] | null;
    unseenEpisodesCount?: number | null;
    userRating?: UserRating | null;
    upcomingEpisode?: TvEpisode | null;
    nextAiring?: string | null;
    onWatchlist?: boolean | null;
    lastSeenAt?: number | null;
    seen?: boolean | null;
    firstUnwatchedEpisode?: TvEpisode | null;
};

export interface TvSeason {
    id?: number | null;
    description?: string | null;
    numberOfEpisodes?: number | null;
    poster?: string | null;
    releaseDate?: string | null;
    tvShowId?: number | null;
    tmdbId?: number | null;
    title: string;
    seasonNumber: number;
    tvmazeId?: number | null;
    episodes?: TvEpisode[] | null;
    userRating?: UserRating | null;
    seen?: boolean | null;
    posterSmall?: string | null;
    isSpecialSeason: boolean;
}

export type GetItemsRequest = {
    orderBy?: MediaItemOrderBy | null;
    sortOrder?: SortOrder | null;
    filter?: string | null;
    onlyOnWatchlist?: boolean | null;
    onlySeenItems?: boolean | null;
    onlyWithNextEpisodesToWatch?: boolean | null;
    onlyWithNextAiring?: boolean | null;
    onlyWithUserRating?: boolean | null;
    onlyWithoutUserRating?: boolean | null;
    page?: number | null;
} & { mediaType?: MediaType | null };

export type MediaItemOrderBy =
    | 'lastSeen'
    | 'mediaType'
    | 'nextAiring'
    | 'releaseDate'
    | 'status'
    | 'title'
    | 'unseenEpisodes';

export type SortOrder = 'asc' | 'desc';

export interface MetadataProviderCredentialsRequestType {
    name: 'IGDB';
    credentials: { CLIENT_ID: string; CLIENT_SECRET: string };
}

export type LastSeenAt = 'custom_date' | 'now' | 'release_date' | 'unknown';

export interface UserResponse {
    id: number;
    name: string;
    admin?: boolean | null;
    publicReviews?: boolean | null;
    sendNotificationWhenStatusChanges?: boolean | null;
    sendNotificationWhenReleaseDateChanges?: boolean | null;
    sendNotificationWhenNumberOfSeasonsChanges?: boolean | null;
    sendNotificationForReleases?: boolean | null;
    sendNotificationForEpisodesReleases?: boolean | null;
    notificationPlatform?:
        | 'Pushbullet'
        | 'Pushover'
        | 'Pushsafer'
        | 'gotify'
        | 'ntfy'
        | null;
}

export interface RequestError {
    errorMessage: string;
    MediaTrackerError: true;
}

export type NotificationPlatformsResponseType =
    | {
          platformName: 'gotify';
          credentials: { url: string; token: string; priority: string };
      }
    | { platformName: 'Pushbullet'; credentials: { token: string } }
    | { platformName: 'Pushover'; credentials: { key: string } }
    | { platformName: 'Pushsafer'; credentials: { key: string } }
    | {
          platformName: 'ntfy';
          credentials: { url: string; priority: string; topic: string };
      };

export namespace Calendar {
    /**
     * No description
     * @tags Calendar
     * @name Get
     * @request GET:/api/calendar
     * @secure
     */
    export namespace Get {
        export type RequestParams = {};
        export type RequestQuery = {
            start?: string | null;
            end?: string | null;
        };
        export type RequestBody = never;
        export type RequestHeaders = {};
        export type ResponseBody = {
            episodes: TvEpisode[];
            items: MediaItemItemsResponse[];
        };
    }
}

export namespace Configuration {
    /**
     * No description
     * @tags Configuration
     * @name Update
     * @request PATCH:/api/configuration
     * @secure
     */
    export namespace Update {
        export type RequestParams = {};
        export type RequestQuery = {};
        export type RequestBody = { enableRegistration?: boolean | null };
        export type RequestHeaders = {};
        export type ResponseBody = any;
    }
    /**
     * No description
     * @tags Configuration
     * @name Get
     * @request GET:/api/configuration
     * @secure
     */
    export namespace Get {
        export type RequestParams = {};
        export type RequestQuery = {};
        export type RequestBody = never;
        export type RequestHeaders = {};
        export type ResponseBody = { enableRegistration: boolean } & {
            noUsers: boolean;
        };
    }
}

export namespace Poster {
    /**
     * No description
     * @tags Img
     * @name GetPoster
     * @request GET:/img/poster
     * @secure
     */
    export namespace GetPoster {
        export type RequestParams = {};
        export type RequestQuery = {
            mediaItemId?: number | null;
            seasonId?: number | null;
            size?: ImgSize | null;
        };
        export type RequestBody = never;
        export type RequestHeaders = {};
        export type ResponseBody = string;
    }
}

export namespace Backdrop {
    /**
     * No description
     * @tags Img
     * @name GetBackdrop
     * @request GET:/img/backdrop
     * @secure
     */
    export namespace GetBackdrop {
        export type RequestParams = {};
        export type RequestQuery = {
            mediaItemId: number;
            size?: ImgSize | null;
        };
        export type RequestBody = never;
        export type RequestHeaders = {};
        export type ResponseBody = string;
    }
}

export namespace Details {
    /**
     * No description
     * @tags MediaItem
     * @name Get
     * @request GET:/api/details/{mediaItemId}
     * @secure
     */
    export namespace Get {
        export type RequestParams = { mediaItemId: number };
        export type RequestQuery = {};
        export type RequestBody = never;
        export type RequestHeaders = {};
        export type ResponseBody = MediaItemDetailsResponse;
    }
}

export namespace Items {
    /**
     * @description Get items
     * @tags Items
     * @name Paginated
     * @request GET:/api/items/paginated
     * @secure
     */
    export namespace Paginated {
        export type RequestParams = {};
        export type RequestQuery = {
            orderBy?: MediaItemOrderBy | null;
            sortOrder?: SortOrder | null;
            filter?: string | null;
            onlyOnWatchlist?: boolean | null;
            onlySeenItems?: boolean | null;
            onlyWithNextEpisodesToWatch?: boolean | null;
            onlyWithNextAiring?: boolean | null;
            onlyWithUserRating?: boolean | null;
            onlyWithoutUserRating?: boolean | null;
            page?: number | null;
            mediaType?: MediaType | null;
        };
        export type RequestBody = never;
        export type RequestHeaders = {};
        export type ResponseBody = {
            data: MediaItemItemsResponse[];
            page: number;
            totalPages: number;
            from: number;
            to: number;
            total: number;
        };
    }
    /**
     * @description Get items
     * @tags Items
     * @name Get
     * @request GET:/api/items
     * @secure
     */
    export namespace Get {
        export type RequestParams = {};
        export type RequestQuery = {
            mediaType?: MediaType | null;
            orderBy?: MediaItemOrderBy | null;
            sortOrder?: SortOrder | null;
            filter?: string | null;
            onlyOnWatchlist?: boolean | null;
            onlySeenItems?: boolean | null;
            onlyWithNextEpisodesToWatch?: boolean | null;
            onlyWithNextAiring?: boolean | null;
            onlyWithUserRating?: boolean | null;
            onlyWithoutUserRating?: boolean | null;
        };
        export type RequestBody = never;
        export type RequestHeaders = {};
        export type ResponseBody = MediaItemItemsResponse[];
    }
}

export namespace MetadataProviderCredentials {
    /**
     * No description
     * @tags MetadataProviderCredentials
     * @name Get
     * @request GET:/api/metadata-provider-credentials
     * @secure
     */
    export namespace Get {
        export type RequestParams = {};
        export type RequestQuery = {};
        export type RequestBody = never;
        export type RequestHeaders = {};
        export type ResponseBody = {
            IGDB?: { CLIENT_ID: string; CLIENT_SECRET: string };
        };
    }
    /**
     * No description
     * @tags MetadataProviderCredentials
     * @name Set
     * @request PUT:/api/metadata-provider-credentials
     * @secure
     */
    export namespace Set {
        export type RequestParams = {};
        export type RequestQuery = {};
        export type RequestBody = MetadataProviderCredentialsRequestType;
        export type RequestHeaders = {};
        export type ResponseBody = any;
    }
}

export namespace Rating {
    /**
     * No description
     * @tags Rating
     * @name Add
     * @request PUT:/api/rating
     * @secure
     */
    export namespace Add {
        export type RequestParams = {};
        export type RequestQuery = {};
        export type RequestBody = {
            mediaItemId: number;
            seasonId?: number | null;
            episodeId?: number | null;
            rating?: number | null;
            review?: string | null;
        };
        export type RequestHeaders = {};
        export type ResponseBody = any;
    }
}

export namespace Search {
    /**
     * No description
     * @tags Search
     * @name Search
     * @request GET:/api/search
     * @secure
     */
    export namespace Search {
        export type RequestParams = {};
        export type RequestQuery = { q: string; mediaType: MediaType };
        export type RequestBody = never;
        export type RequestHeaders = {};
        export type ResponseBody = MediaItemItemsResponse[];
    }
}

export namespace Seen {
    /**
     * No description
     * @tags Seen
     * @name Add
     * @request PUT:/api/seen
     * @secure
     */
    export namespace Add {
        export type RequestParams = {};
        export type RequestQuery = {
            mediaItemId: number;
            seasonId?: number | null;
            episodeId?: number | null;
            lastSeenEpisodeId?: number | null;
            lastSeenAt?: LastSeenAt | null;
            date?: number | null;
        };
        export type RequestBody = never;
        export type RequestHeaders = {};
        export type ResponseBody = any;
    }
    /**
     * No description
     * @tags Seen
     * @name DeleteById
     * @request DELETE:/api/seen/{seenId}
     * @secure
     */
    export namespace DeleteById {
        export type RequestParams = { seenId: number };
        export type RequestQuery = {};
        export type RequestBody = never;
        export type RequestHeaders = {};
        export type ResponseBody = any;
    }
    /**
     * No description
     * @tags Seen
     * @name Delete
     * @request DELETE:/api/seen/
     * @secure
     */
    export namespace Delete {
        export type RequestParams = {};
        export type RequestQuery = {
            mediaItemId: number;
            seasonId?: number | null;
            episodeId?: number | null;
        };
        export type RequestBody = never;
        export type RequestHeaders = {};
        export type ResponseBody = any;
    }
}

export namespace Tokens {
    /**
     * @description Add token
     * @tags Token
     * @name Add
     * @request PUT:/api/tokens
     * @secure
     */
    export namespace Add {
        export type RequestParams = {};
        export type RequestQuery = { description: string };
        export type RequestBody = never;
        export type RequestHeaders = {};
        export type ResponseBody = { token: string };
    }
    /**
     * @description Delete token
     * @tags Token
     * @name Delete
     * @request DELETE:/api/tokens
     * @secure
     */
    export namespace Delete {
        export type RequestParams = {};
        export type RequestQuery = { description: string };
        export type RequestBody = never;
        export type RequestHeaders = {};
        export type ResponseBody = any;
    }
    /**
     * @description Get all tokens
     * @tags Token
     * @name Get
     * @request GET:/api/tokens
     * @secure
     */
    export namespace Get {
        export type RequestParams = {};
        export type RequestQuery = {};
        export type RequestBody = never;
        export type RequestHeaders = {};
        export type ResponseBody = string[];
    }
}

export namespace ImportTrakttv {
    /**
     * No description
     * @tags TraktTvImport
     * @name DeviceToken
     * @request GET:/api/import-trakttv/device-token
     * @secure
     */
    export namespace DeviceToken {
        export type RequestParams = {};
        export type RequestQuery = {};
        export type RequestBody = never;
        export type RequestHeaders = {};
        export type ResponseBody = {
            userCode: string;
            verificationUrl: string;
        };
    }
    /**
     * No description
     * @tags TraktTvImport
     * @name IsAuthenticated
     * @request GET:/api/import-trakttv/is-authenticated
     * @secure
     */
    export namespace IsAuthenticated {
        export type RequestParams = {};
        export type RequestQuery = {};
        export type RequestBody = never;
        export type RequestHeaders = {};
        export type ResponseBody = boolean;
    }
    /**
     * No description
     * @tags TraktTvImport
     * @name ItemsToImport
     * @request GET:/api/import-trakttv/items-to-import
     * @secure
     */
    export namespace ItemsToImport {
        export type RequestParams = {};
        export type RequestQuery = {};
        export type RequestBody = never;
        export type RequestHeaders = {};
        export type ResponseBody = {
            watchlist: MediaItemItemsResponse[];
            seen: MediaItemItemsResponse[];
        };
    }
    /**
     * No description
     * @tags TraktTvImport
     * @name Import
     * @request GET:/api/import-trakttv
     * @secure
     */
    export namespace Import {
        export type RequestParams = {};
        export type RequestQuery = {};
        export type RequestBody = never;
        export type RequestHeaders = {};
        export type ResponseBody = any;
    }
}

export namespace User {
    /**
     * No description
     * @tags User
     * @name Get
     * @request GET:/api/user
     * @secure
     */
    export namespace Get {
        export type RequestParams = {};
        export type RequestQuery = {};
        export type RequestBody = never;
        export type RequestHeaders = {};
        export type ResponseBody = UserResponse | null;
    }
    /**
     * No description
     * @tags User
     * @name Logout
     * @request GET:/api/user/logout
     * @secure
     */
    export namespace Logout {
        export type RequestParams = {};
        export type RequestQuery = {};
        export type RequestBody = never;
        export type RequestHeaders = {};
        export type ResponseBody = any;
    }
    /**
     * No description
     * @tags User
     * @name Login
     * @request POST:/api/user/login
     * @secure
     */
    export namespace Login {
        export type RequestParams = {};
        export type RequestQuery = {};
        export type RequestBody = { username: string; password: string };
        export type RequestHeaders = {};
        export type ResponseBody = any;
    }
    /**
     * No description
     * @tags User
     * @name Register
     * @request POST:/api/user/register
     * @secure
     */
    export namespace Register {
        export type RequestParams = {};
        export type RequestQuery = {};
        export type RequestBody = {
            username: string;
            password: string;
            confirmPassword: string;
        };
        export type RequestHeaders = {};
        export type ResponseBody = UserResponse | RequestError;
    }
    /**
     * No description
     * @tags User
     * @name GetNotificationCredentials
     * @request GET:/api/user/notification-credentials
     * @secure
     */
    export namespace GetNotificationCredentials {
        export type RequestParams = {};
        export type RequestQuery = {};
        export type RequestBody = never;
        export type RequestHeaders = {};
        export type ResponseBody = {
            gotify?: { url: string; token: string; priority: string };
            Pushbullet?: { token: string };
            Pushover?: { key: string };
            Pushsafer?: { key: string };
            ntfy?: { url: string; priority: string; topic: string };
        };
    }
    /**
     * No description
     * @tags User
     * @name UpdateNotificationCredentials
     * @request PUT:/api/user/notification-credentials
     * @secure
     */
    export namespace UpdateNotificationCredentials {
        export type RequestParams = {};
        export type RequestQuery = {};
        export type RequestBody = NotificationPlatformsResponseType;
        export type RequestHeaders = {};
        export type ResponseBody = any;
    }
    /**
     * No description
     * @tags User
     * @name Update
     * @request PUT:/api/user/settings
     * @secure
     */
    export namespace Update {
        export type RequestParams = {};
        export type RequestQuery = {};
        export type RequestBody = {
            name?: string | null;
            publicReviews?: boolean | null;
            sendNotificationWhenStatusChanges?: boolean | null;
            sendNotificationWhenReleaseDateChanges?: boolean | null;
            sendNotificationWhenNumberOfSeasonsChanges?: boolean | null;
            sendNotificationForReleases?: boolean | null;
            sendNotificationForEpisodesReleases?: boolean | null;
            notificationPlatform?:
                | 'Pushbullet'
                | 'Pushover'
                | 'Pushsafer'
                | 'gotify'
                | 'ntfy'
                | null;
        };
        export type RequestHeaders = {};
        export type ResponseBody = any;
    }
    /**
     * No description
     * @tags User
     * @name UpdatePassword
     * @request PUT:/api/user/password
     * @secure
     */
    export namespace UpdatePassword {
        export type RequestParams = {};
        export type RequestQuery = {};
        export type RequestBody = {
            currentPassword: string;
            newPassword: string;
        };
        export type RequestHeaders = {};
        export type ResponseBody = any;
    }
    /**
     * No description
     * @tags User
     * @name GetById
     * @request GET:/api/user/{userId}
     * @secure
     */
    export namespace GetById {
        export type RequestParams = { userId: number };
        export type RequestQuery = {};
        export type RequestBody = never;
        export type RequestHeaders = {};
        export type ResponseBody = { id: number; name: string };
    }
}

export namespace Watchlist {
    /**
     * No description
     * @tags Watchlist
     * @name Add
     * @request PUT:/api/watchlist
     * @secure
     */
    export namespace Add {
        export type RequestParams = {};
        export type RequestQuery = { mediaItemId: number };
        export type RequestBody = never;
        export type RequestHeaders = {};
        export type ResponseBody = any;
    }
    /**
     * No description
     * @tags Watchlist
     * @name Delete
     * @request DELETE:/api/watchlist
     * @secure
     */
    export namespace Delete {
        export type RequestParams = {};
        export type RequestQuery = { mediaItemId: number };
        export type RequestBody = never;
        export type RequestHeaders = {};
        export type ResponseBody = any;
    }
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, 'body' | 'bodyUsed'>;

export interface FullRequestParams extends Omit<RequestInit, 'body'> {
    /** set parameter to `true` for call `securityWorker` for this request */
    secure?: boolean;
    /** request path */
    path: string;
    /** content type of request body */
    type?: ContentType;
    /** query params */
    query?: QueryParamsType;
    /** format of response (i.e. response.json() -> format: "json") */
    format?: ResponseFormat;
    /** request body */
    body?: unknown;
    /** base url */
    baseUrl?: string;
    /** request cancellation token */
    cancelToken?: CancelToken;
}

export type RequestParams = Omit<
    FullRequestParams,
    'body' | 'method' | 'query' | 'path'
>;

export interface ApiConfig<SecurityDataType = unknown> {
    baseUrl?: string;
    baseApiParams?: Omit<RequestParams, 'baseUrl' | 'cancelToken' | 'signal'>;
    securityWorker?: (
        securityData: SecurityDataType | null
    ) => Promise<RequestParams | void> | RequestParams | void;
    customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown>
    extends Response {
    data: D;
    error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
    Json = 'application/json',
    FormData = 'multipart/form-data',
    UrlEncoded = 'application/x-www-form-urlencoded',
}

export class HttpClient<SecurityDataType = unknown> {
    public baseUrl: string = '';
    private securityData: SecurityDataType | null = null;
    private securityWorker?: ApiConfig<SecurityDataType>['securityWorker'];
    private abortControllers = new Map<CancelToken, AbortController>();
    private customFetch = (...fetchParams: Parameters<typeof fetch>) =>
        fetch(...fetchParams);

    private baseApiParams: RequestParams = {
        credentials: 'same-origin',
        headers: {},
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
    };

    constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
        Object.assign(this, apiConfig);
    }

    public setSecurityData = (data: SecurityDataType | null) => {
        this.securityData = data;
    };

    private encodeQueryParam(key: string, value: any) {
        const encodedKey = encodeURIComponent(key);
        return `${encodedKey}=${encodeURIComponent(
            typeof value === 'number' ? value : `${value}`
        )}`;
    }

    private addQueryParam(query: QueryParamsType, key: string) {
        return this.encodeQueryParam(key, query[key]);
    }

    private addArrayQueryParam(query: QueryParamsType, key: string) {
        const value = query[key];
        return value.map((v: any) => this.encodeQueryParam(key, v)).join('&');
    }

    protected toQueryString(rawQuery?: QueryParamsType): string {
        const query = rawQuery || {};
        const keys = Object.keys(query).filter(
            (key) => 'undefined' !== typeof query[key]
        );
        return keys
            .map((key) =>
                Array.isArray(query[key])
                    ? this.addArrayQueryParam(query, key)
                    : this.addQueryParam(query, key)
            )
            .join('&');
    }

    protected addQueryParams(rawQuery?: QueryParamsType): string {
        const queryString = this.toQueryString(rawQuery);
        return queryString ? `?${queryString}` : '';
    }

    private contentFormatters: Record<ContentType, (input: any) => any> = {
        [ContentType.Json]: (input: any) =>
            input !== null &&
            (typeof input === 'object' || typeof input === 'string')
                ? JSON.stringify(input)
                : input,
        [ContentType.FormData]: (input: any) =>
            Object.keys(input || {}).reduce((formData, key) => {
                const property = input[key];
                formData.append(
                    key,
                    property instanceof Blob
                        ? property
                        : typeof property === 'object' && property !== null
                        ? JSON.stringify(property)
                        : `${property}`
                );
                return formData;
            }, new FormData()),
        [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
    };

    private mergeRequestParams(
        params1: RequestParams,
        params2?: RequestParams
    ): RequestParams {
        return {
            ...this.baseApiParams,
            ...params1,
            ...(params2 || {}),
            headers: {
                ...(this.baseApiParams.headers || {}),
                ...(params1.headers || {}),
                ...((params2 && params2.headers) || {}),
            },
        };
    }

    private createAbortSignal = (
        cancelToken: CancelToken
    ): AbortSignal | undefined => {
        if (this.abortControllers.has(cancelToken)) {
            const abortController = this.abortControllers.get(cancelToken);
            if (abortController) {
                return abortController.signal;
            }
            return void 0;
        }

        const abortController = new AbortController();
        this.abortControllers.set(cancelToken, abortController);
        return abortController.signal;
    };

    public abortRequest = (cancelToken: CancelToken) => {
        const abortController = this.abortControllers.get(cancelToken);

        if (abortController) {
            abortController.abort();
            this.abortControllers.delete(cancelToken);
        }
    };

    public request = async <T = any, E = any>({
        body,
        secure,
        path,
        type,
        query,
        format,
        baseUrl,
        cancelToken,
        ...params
    }: FullRequestParams): Promise<T> => {
        const secureParams =
            ((typeof secure === 'boolean'
                ? secure
                : this.baseApiParams.secure) &&
                this.securityWorker &&
                (await this.securityWorker(this.securityData))) ||
            {};
        const requestParams = this.mergeRequestParams(params, secureParams);
        const queryString = query && this.toQueryString(query);
        const payloadFormatter =
            this.contentFormatters[type || ContentType.Json];
        const responseFormat = format || requestParams.format;

        return this.customFetch(
            `${baseUrl || this.baseUrl || ''}${path}${
                queryString ? `?${queryString}` : ''
            }`,
            {
                ...requestParams,
                headers: {
                    ...(type && type !== ContentType.FormData
                        ? { 'Content-Type': type }
                        : {}),
                    ...(requestParams.headers || {}),
                },
                signal: cancelToken
                    ? this.createAbortSignal(cancelToken)
                    : void 0,
                body:
                    typeof body === 'undefined' || body === null
                        ? null
                        : payloadFormatter(body),
            }
        ).then(async (response) => {
            const r = response as HttpResponse<T, E>;
            r.data = null as unknown as T;
            r.error = null as unknown as E;

            const data = !responseFormat
                ? r
                : await response[responseFormat]()
                      .then((data) => {
                          if (r.ok) {
                              r.data = data;
                          } else {
                              r.error = data;
                          }
                          return r;
                      })
                      .catch((e) => {
                          r.error = e;
                          return r;
                      });

            if (cancelToken) {
                this.abortControllers.delete(cancelToken);
            }

            if (!response.ok) throw data;
            return data.data;
        });
    };
}

/**
 * @title MediaTracker
 * @version 0.0.1
 * @license MIT (https://opensource.org/licenses/MIT)
 */
export class Api<
    SecurityDataType extends unknown
> extends HttpClient<SecurityDataType> {
    calendar = {
        /**
         * No description
         *
         * @tags Calendar
         * @name Get
         * @request GET:/api/calendar
         * @secure
         */
        get: (
            query?: { start?: string | null; end?: string | null },
            params: RequestParams = {}
        ) =>
            this.request<
                { episodes: TvEpisode[]; items: MediaItemItemsResponse[] },
                any
            >({
                path: `/api/calendar`,
                method: 'GET',
                query: query,
                secure: true,
                format: 'json',
                ...params,
            }),
    };
    configuration = {
        /**
         * No description
         *
         * @tags Configuration
         * @name Update
         * @request PATCH:/api/configuration
         * @secure
         */
        update: (
            data: { enableRegistration?: boolean | null },
            params: RequestParams = {}
        ) =>
            this.request<any, any>({
                path: `/api/configuration`,
                method: 'PATCH',
                body: data,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Configuration
         * @name Get
         * @request GET:/api/configuration
         * @secure
         */
        get: (params: RequestParams = {}) =>
            this.request<
                { enableRegistration: boolean } & { noUsers: boolean },
                any
            >({
                path: `/api/configuration`,
                method: 'GET',
                secure: true,
                format: 'json',
                ...params,
            }),
    };
    poster = {
        /**
         * No description
         *
         * @tags Img
         * @name GetPoster
         * @request GET:/img/poster
         * @secure
         */
        getPoster: (
            query?: {
                mediaItemId?: number | null;
                seasonId?: number | null;
                size?: ImgSize | null;
            },
            params: RequestParams = {}
        ) =>
            this.request<string, any>({
                path: `/img/poster`,
                method: 'GET',
                query: query,
                secure: true,
                format: 'json',
                ...params,
            }),
    };
    backdrop = {
        /**
         * No description
         *
         * @tags Img
         * @name GetBackdrop
         * @request GET:/img/backdrop
         * @secure
         */
        getBackdrop: (
            query: { mediaItemId: number; size?: ImgSize | null },
            params: RequestParams = {}
        ) =>
            this.request<string, any>({
                path: `/img/backdrop`,
                method: 'GET',
                query: query,
                secure: true,
                format: 'json',
                ...params,
            }),
    };
    details = {
        /**
         * No description
         *
         * @tags MediaItem
         * @name Get
         * @request GET:/api/details/{mediaItemId}
         * @secure
         */
        get: (mediaItemId: number, params: RequestParams = {}) =>
            this.request<MediaItemDetailsResponse, any>({
                path: `/api/details/${mediaItemId}`,
                method: 'GET',
                secure: true,
                format: 'json',
                ...params,
            }),
    };
    items = {
        /**
         * @description Get items
         *
         * @tags Items
         * @name Paginated
         * @request GET:/api/items/paginated
         * @secure
         */
        paginated: (
            query?: {
                orderBy?: MediaItemOrderBy | null;
                sortOrder?: SortOrder | null;
                filter?: string | null;
                onlyOnWatchlist?: boolean | null;
                onlySeenItems?: boolean | null;
                onlyWithNextEpisodesToWatch?: boolean | null;
                onlyWithNextAiring?: boolean | null;
                onlyWithUserRating?: boolean | null;
                onlyWithoutUserRating?: boolean | null;
                page?: number | null;
                mediaType?: MediaType | null;
            },
            params: RequestParams = {}
        ) =>
            this.request<
                {
                    data: MediaItemItemsResponse[];
                    page: number;
                    totalPages: number;
                    from: number;
                    to: number;
                    total: number;
                },
                any
            >({
                path: `/api/items/paginated`,
                method: 'GET',
                query: query,
                secure: true,
                format: 'json',
                ...params,
            }),

        /**
         * @description Get items
         *
         * @tags Items
         * @name Get
         * @request GET:/api/items
         * @secure
         */
        get: (
            query?: {
                mediaType?: MediaType | null;
                orderBy?: MediaItemOrderBy | null;
                sortOrder?: SortOrder | null;
                filter?: string | null;
                onlyOnWatchlist?: boolean | null;
                onlySeenItems?: boolean | null;
                onlyWithNextEpisodesToWatch?: boolean | null;
                onlyWithNextAiring?: boolean | null;
                onlyWithUserRating?: boolean | null;
                onlyWithoutUserRating?: boolean | null;
            },
            params: RequestParams = {}
        ) =>
            this.request<MediaItemItemsResponse[], any>({
                path: `/api/items`,
                method: 'GET',
                query: query,
                secure: true,
                format: 'json',
                ...params,
            }),
    };
    metadataProviderCredentials = {
        /**
         * No description
         *
         * @tags MetadataProviderCredentials
         * @name Get
         * @request GET:/api/metadata-provider-credentials
         * @secure
         */
        get: (params: RequestParams = {}) =>
            this.request<
                { IGDB?: { CLIENT_ID: string; CLIENT_SECRET: string } },
                any
            >({
                path: `/api/metadata-provider-credentials`,
                method: 'GET',
                secure: true,
                format: 'json',
                ...params,
            }),

        /**
         * No description
         *
         * @tags MetadataProviderCredentials
         * @name Set
         * @request PUT:/api/metadata-provider-credentials
         * @secure
         */
        set: (
            data: MetadataProviderCredentialsRequestType,
            params: RequestParams = {}
        ) =>
            this.request<any, any>({
                path: `/api/metadata-provider-credentials`,
                method: 'PUT',
                body: data,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),
    };
    rating = {
        /**
         * No description
         *
         * @tags Rating
         * @name Add
         * @request PUT:/api/rating
         * @secure
         */
        add: (
            data: {
                mediaItemId: number;
                seasonId?: number | null;
                episodeId?: number | null;
                rating?: number | null;
                review?: string | null;
            },
            params: RequestParams = {}
        ) =>
            this.request<any, any>({
                path: `/api/rating`,
                method: 'PUT',
                body: data,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),
    };
    search = {
        /**
         * No description
         *
         * @tags Search
         * @name Search
         * @request GET:/api/search
         * @secure
         */
        search: (
            query: { q: string; mediaType: MediaType },
            params: RequestParams = {}
        ) =>
            this.request<MediaItemItemsResponse[], any>({
                path: `/api/search`,
                method: 'GET',
                query: query,
                secure: true,
                format: 'json',
                ...params,
            }),
    };
    seen = {
        /**
         * No description
         *
         * @tags Seen
         * @name Add
         * @request PUT:/api/seen
         * @secure
         */
        add: (
            query: {
                mediaItemId: number;
                seasonId?: number | null;
                episodeId?: number | null;
                lastSeenEpisodeId?: number | null;
                lastSeenAt?: LastSeenAt | null;
                date?: number | null;
            },
            params: RequestParams = {}
        ) =>
            this.request<any, any>({
                path: `/api/seen`,
                method: 'PUT',
                query: query,
                secure: true,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Seen
         * @name DeleteById
         * @request DELETE:/api/seen/{seenId}
         * @secure
         */
        deleteById: (seenId: number, params: RequestParams = {}) =>
            this.request<any, any>({
                path: `/api/seen/${seenId}`,
                method: 'DELETE',
                secure: true,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Seen
         * @name Delete
         * @request DELETE:/api/seen/
         * @secure
         */
        delete: (
            query: {
                mediaItemId: number;
                seasonId?: number | null;
                episodeId?: number | null;
            },
            params: RequestParams = {}
        ) =>
            this.request<any, any>({
                path: `/api/seen/`,
                method: 'DELETE',
                query: query,
                secure: true,
                ...params,
            }),
    };
    tokens = {
        /**
         * @description Add token
         *
         * @tags Token
         * @name Add
         * @request PUT:/api/tokens
         * @secure
         */
        add: (query: { description: string }, params: RequestParams = {}) =>
            this.request<{ token: string }, any>({
                path: `/api/tokens`,
                method: 'PUT',
                query: query,
                secure: true,
                format: 'json',
                ...params,
            }),

        /**
         * @description Delete token
         *
         * @tags Token
         * @name Delete
         * @request DELETE:/api/tokens
         * @secure
         */
        delete: (query: { description: string }, params: RequestParams = {}) =>
            this.request<any, any>({
                path: `/api/tokens`,
                method: 'DELETE',
                query: query,
                secure: true,
                ...params,
            }),

        /**
         * @description Get all tokens
         *
         * @tags Token
         * @name Get
         * @request GET:/api/tokens
         * @secure
         */
        get: (params: RequestParams = {}) =>
            this.request<string[], any>({
                path: `/api/tokens`,
                method: 'GET',
                secure: true,
                format: 'json',
                ...params,
            }),
    };
    importTrakttv = {
        /**
         * No description
         *
         * @tags TraktTvImport
         * @name DeviceToken
         * @request GET:/api/import-trakttv/device-token
         * @secure
         */
        deviceToken: (params: RequestParams = {}) =>
            this.request<{ userCode: string; verificationUrl: string }, any>({
                path: `/api/import-trakttv/device-token`,
                method: 'GET',
                secure: true,
                format: 'json',
                ...params,
            }),

        /**
         * No description
         *
         * @tags TraktTvImport
         * @name IsAuthenticated
         * @request GET:/api/import-trakttv/is-authenticated
         * @secure
         */
        isAuthenticated: (params: RequestParams = {}) =>
            this.request<boolean, any>({
                path: `/api/import-trakttv/is-authenticated`,
                method: 'GET',
                secure: true,
                format: 'json',
                ...params,
            }),

        /**
         * No description
         *
         * @tags TraktTvImport
         * @name ItemsToImport
         * @request GET:/api/import-trakttv/items-to-import
         * @secure
         */
        itemsToImport: (params: RequestParams = {}) =>
            this.request<
                {
                    watchlist: MediaItemItemsResponse[];
                    seen: MediaItemItemsResponse[];
                },
                any
            >({
                path: `/api/import-trakttv/items-to-import`,
                method: 'GET',
                secure: true,
                format: 'json',
                ...params,
            }),

        /**
         * No description
         *
         * @tags TraktTvImport
         * @name Import
         * @request GET:/api/import-trakttv
         * @secure
         */
        import: (params: RequestParams = {}) =>
            this.request<any, any>({
                path: `/api/import-trakttv`,
                method: 'GET',
                secure: true,
                ...params,
            }),
    };
    user = {
        /**
         * No description
         *
         * @tags User
         * @name Get
         * @request GET:/api/user
         * @secure
         */
        get: (params: RequestParams = {}) =>
            this.request<UserResponse | null, any>({
                path: `/api/user`,
                method: 'GET',
                secure: true,
                format: 'json',
                ...params,
            }),

        /**
         * No description
         *
         * @tags User
         * @name Logout
         * @request GET:/api/user/logout
         * @secure
         */
        logout: (params: RequestParams = {}) =>
            this.request<any, any>({
                path: `/api/user/logout`,
                method: 'GET',
                secure: true,
                ...params,
            }),

        /**
         * No description
         *
         * @tags User
         * @name Login
         * @request POST:/api/user/login
         * @secure
         */
        login: (
            data: { username: string; password: string },
            params: RequestParams = {}
        ) =>
            this.request<any, any>({
                path: `/api/user/login`,
                method: 'POST',
                body: data,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags User
         * @name Register
         * @request POST:/api/user/register
         * @secure
         */
        register: (
            data: {
                username: string;
                password: string;
                confirmPassword: string;
            },
            params: RequestParams = {}
        ) =>
            this.request<UserResponse | RequestError, any>({
                path: `/api/user/register`,
                method: 'POST',
                body: data,
                secure: true,
                type: ContentType.Json,
                format: 'json',
                ...params,
            }),

        /**
         * No description
         *
         * @tags User
         * @name GetNotificationCredentials
         * @request GET:/api/user/notification-credentials
         * @secure
         */
        getNotificationCredentials: (params: RequestParams = {}) =>
            this.request<
                {
                    gotify?: { url: string; token: string; priority: string };
                    Pushbullet?: { token: string };
                    Pushover?: { key: string };
                    Pushsafer?: { key: string };
                    ntfy?: { url: string; priority: string; topic: string };
                },
                any
            >({
                path: `/api/user/notification-credentials`,
                method: 'GET',
                secure: true,
                format: 'json',
                ...params,
            }),

        /**
         * No description
         *
         * @tags User
         * @name UpdateNotificationCredentials
         * @request PUT:/api/user/notification-credentials
         * @secure
         */
        updateNotificationCredentials: (
            data: NotificationPlatformsResponseType,
            params: RequestParams = {}
        ) =>
            this.request<any, any>({
                path: `/api/user/notification-credentials`,
                method: 'PUT',
                body: data,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags User
         * @name Update
         * @request PUT:/api/user/settings
         * @secure
         */
        update: (
            data: {
                name?: string | null;
                publicReviews?: boolean | null;
                sendNotificationWhenStatusChanges?: boolean | null;
                sendNotificationWhenReleaseDateChanges?: boolean | null;
                sendNotificationWhenNumberOfSeasonsChanges?: boolean | null;
                sendNotificationForReleases?: boolean | null;
                sendNotificationForEpisodesReleases?: boolean | null;
                notificationPlatform?:
                    | 'Pushbullet'
                    | 'Pushover'
                    | 'Pushsafer'
                    | 'gotify'
                    | 'ntfy'
                    | null;
            },
            params: RequestParams = {}
        ) =>
            this.request<any, any>({
                path: `/api/user/settings`,
                method: 'PUT',
                body: data,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags User
         * @name UpdatePassword
         * @request PUT:/api/user/password
         * @secure
         */
        updatePassword: (
            data: { currentPassword: string; newPassword: string },
            params: RequestParams = {}
        ) =>
            this.request<any, any>({
                path: `/api/user/password`,
                method: 'PUT',
                body: data,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags User
         * @name GetById
         * @request GET:/api/user/{userId}
         * @secure
         */
        getById: (userId: number, params: RequestParams = {}) =>
            this.request<{ id: number; name: string }, any>({
                path: `/api/user/${userId}`,
                method: 'GET',
                secure: true,
                format: 'json',
                ...params,
            }),
    };
    watchlist = {
        /**
         * No description
         *
         * @tags Watchlist
         * @name Add
         * @request PUT:/api/watchlist
         * @secure
         */
        add: (query: { mediaItemId: number }, params: RequestParams = {}) =>
            this.request<any, any>({
                path: `/api/watchlist`,
                method: 'PUT',
                query: query,
                secure: true,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Watchlist
         * @name Delete
         * @request DELETE:/api/watchlist
         * @secure
         */
        delete: (query: { mediaItemId: number }, params: RequestParams = {}) =>
            this.request<any, any>({
                path: `/api/watchlist`,
                method: 'DELETE',
                query: query,
                secure: true,
                ...params,
            }),
    };
}
