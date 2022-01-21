"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Api = exports.HttpClient = exports.ContentType = void 0;
var ContentType;
(function (ContentType) {
    ContentType["Json"] = "application/json";
    ContentType["FormData"] = "multipart/form-data";
    ContentType["UrlEncoded"] = "application/x-www-form-urlencoded";
})(ContentType = exports.ContentType || (exports.ContentType = {}));
class HttpClient {
    constructor(apiConfig = {}) {
        this.baseUrl = '';
        this.securityData = null;
        this.abortControllers = new Map();
        this.customFetch = (...fetchParams) => fetch(...fetchParams);
        this.baseApiParams = {
            credentials: 'same-origin',
            headers: {},
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
        };
        this.setSecurityData = (data) => {
            this.securityData = data;
        };
        this.contentFormatters = {
            [ContentType.Json]: (input) => input !== null &&
                (typeof input === 'object' || typeof input === 'string')
                ? JSON.stringify(input)
                : input,
            [ContentType.FormData]: (input) => Object.keys(input || {}).reduce((formData, key) => {
                const property = input[key];
                formData.append(key, property instanceof Blob
                    ? property
                    : typeof property === 'object' && property !== null
                        ? JSON.stringify(property)
                        : `${property}`);
                return formData;
            }, new FormData()),
            [ContentType.UrlEncoded]: (input) => this.toQueryString(input),
        };
        this.createAbortSignal = (cancelToken) => {
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
        this.abortRequest = (cancelToken) => {
            const abortController = this.abortControllers.get(cancelToken);
            if (abortController) {
                abortController.abort();
                this.abortControllers.delete(cancelToken);
            }
        };
        this.request = async ({ body, secure, path, type, query, format, baseUrl, cancelToken, ...params }) => {
            const secureParams = ((typeof secure === 'boolean'
                ? secure
                : this.baseApiParams.secure) &&
                this.securityWorker &&
                (await this.securityWorker(this.securityData))) ||
                {};
            const requestParams = this.mergeRequestParams(params, secureParams);
            const queryString = query && this.toQueryString(query);
            const payloadFormatter = this.contentFormatters[type || ContentType.Json];
            const responseFormat = format || requestParams.format;
            return this.customFetch(`${baseUrl || this.baseUrl || ''}${path}${queryString ? `?${queryString}` : ''}`, {
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
                body: typeof body === 'undefined' || body === null
                    ? null
                    : payloadFormatter(body),
            }).then(async (response) => {
                const r = response;
                r.data = null;
                r.error = null;
                const data = !responseFormat
                    ? r
                    : await response[responseFormat]()
                        .then((data) => {
                        if (r.ok) {
                            r.data = data;
                        }
                        else {
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
                if (!response.ok)
                    throw data;
                return data.data;
            });
        };
        Object.assign(this, apiConfig);
    }
    encodeQueryParam(key, value) {
        const encodedKey = encodeURIComponent(key);
        return `${encodedKey}=${encodeURIComponent(typeof value === 'number' ? value : `${value}`)}`;
    }
    addQueryParam(query, key) {
        return this.encodeQueryParam(key, query[key]);
    }
    addArrayQueryParam(query, key) {
        const value = query[key];
        return value.map((v) => this.encodeQueryParam(key, v)).join('&');
    }
    toQueryString(rawQuery) {
        const query = rawQuery || {};
        const keys = Object.keys(query).filter((key) => 'undefined' !== typeof query[key]);
        return keys
            .map((key) => Array.isArray(query[key])
            ? this.addArrayQueryParam(query, key)
            : this.addQueryParam(query, key))
            .join('&');
    }
    addQueryParams(rawQuery) {
        const queryString = this.toQueryString(rawQuery);
        return queryString ? `?${queryString}` : '';
    }
    mergeRequestParams(params1, params2) {
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
}
exports.HttpClient = HttpClient;
/**
 * @title MediaTracker
 * @version 0.0.1
 * @license MIT (https://opensource.org/licenses/MIT)
 */
class Api extends HttpClient {
    constructor() {
        super(...arguments);
        this.calendar = {
            /**
             * No description
             *
             * @tags Calendar
             * @name Get
             * @request GET:/api/calendar
             * @secure
             */
            get: (query, params = {}) => this.request({
                path: `/api/calendar`,
                method: 'GET',
                query: query,
                secure: true,
                format: 'json',
                ...params,
            }),
        };
        this.configuration = {
            /**
             * No description
             *
             * @tags Configuration
             * @name Update
             * @request PATCH:/api/configuration
             * @secure
             */
            update: (data, params = {}) => this.request({
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
            get: (params = {}) => this.request({
                path: `/api/configuration`,
                method: 'GET',
                secure: true,
                format: 'json',
                ...params,
            }),
        };
        this.poster = {
            /**
             * No description
             *
             * @tags Img
             * @name GetPoster
             * @request GET:/img/poster
             * @secure
             */
            getPoster: (query, params = {}) => this.request({
                path: `/img/poster`,
                method: 'GET',
                query: query,
                secure: true,
                format: 'json',
                ...params,
            }),
        };
        this.backdrop = {
            /**
             * No description
             *
             * @tags Img
             * @name GetBackdrop
             * @request GET:/img/backdrop
             * @secure
             */
            getBackdrop: (query, params = {}) => this.request({
                path: `/img/backdrop`,
                method: 'GET',
                query: query,
                secure: true,
                format: 'json',
                ...params,
            }),
        };
        this.details = {
            /**
             * No description
             *
             * @tags MediaItem
             * @name Get
             * @request GET:/api/details/{mediaItemId}
             * @secure
             */
            get: (mediaItemId, params = {}) => this.request({
                path: `/api/details/${mediaItemId}`,
                method: 'GET',
                secure: true,
                format: 'json',
                ...params,
            }),
        };
        this.items = {
            /**
             * @description Get items
             *
             * @tags Items
             * @name Paginated
             * @request GET:/api/items/paginated
             * @secure
             */
            paginated: (query, params = {}) => this.request({
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
            get: (query, params = {}) => this.request({
                path: `/api/items`,
                method: 'GET',
                query: query,
                secure: true,
                format: 'json',
                ...params,
            }),
        };
        this.metadataProviderCredentials = {
            /**
             * No description
             *
             * @tags MetadataProviderCredentials
             * @name Get
             * @request GET:/api/metadata-provider-credentials
             * @secure
             */
            get: (params = {}) => this.request({
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
            set: (data, params = {}) => this.request({
                path: `/api/metadata-provider-credentials`,
                method: 'PUT',
                body: data,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),
        };
        this.rating = {
            /**
             * No description
             *
             * @tags Rating
             * @name Add
             * @request PUT:/api/rating
             * @secure
             */
            add: (data, params = {}) => this.request({
                path: `/api/rating`,
                method: 'PUT',
                body: data,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),
        };
        this.search = {
            /**
             * No description
             *
             * @tags Search
             * @name Search
             * @request GET:/api/search
             * @secure
             */
            search: (query, params = {}) => this.request({
                path: `/api/search`,
                method: 'GET',
                query: query,
                secure: true,
                format: 'json',
                ...params,
            }),
        };
        this.seen = {
            /**
             * No description
             *
             * @tags Seen
             * @name Add
             * @request PUT:/api/seen
             * @secure
             */
            add: (query, params = {}) => this.request({
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
            deleteById: (seenId, params = {}) => this.request({
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
            delete: (query, params = {}) => this.request({
                path: `/api/seen/`,
                method: 'DELETE',
                query: query,
                secure: true,
                ...params,
            }),
        };
        this.tokens = {
            /**
             * @description Add token
             *
             * @tags Token
             * @name Add
             * @request PUT:/api/tokens
             * @secure
             */
            add: (query, params = {}) => this.request({
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
            delete: (query, params = {}) => this.request({
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
            get: (params = {}) => this.request({
                path: `/api/tokens`,
                method: 'GET',
                secure: true,
                format: 'json',
                ...params,
            }),
        };
        this.importTrakttv = {
            /**
             * No description
             *
             * @tags TraktTvImport
             * @name DeviceToken
             * @request GET:/api/import-trakttv/device-token
             * @secure
             */
            deviceToken: (params = {}) => this.request({
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
            isAuthenticated: (params = {}) => this.request({
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
            itemsToImport: (params = {}) => this.request({
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
            import: (params = {}) => this.request({
                path: `/api/import-trakttv`,
                method: 'GET',
                secure: true,
                ...params,
            }),
        };
        this.user = {
            /**
             * No description
             *
             * @tags User
             * @name Get
             * @request GET:/api/user
             * @secure
             */
            get: (params = {}) => this.request({
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
            logout: (params = {}) => this.request({
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
            login: (data, params = {}) => this.request({
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
            register: (data, params = {}) => this.request({
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
            getNotificationCredentials: (params = {}) => this.request({
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
            updateNotificationCredentials: (data, params = {}) => this.request({
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
            update: (data, params = {}) => this.request({
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
            updatePassword: (data, params = {}) => this.request({
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
            getById: (userId, params = {}) => this.request({
                path: `/api/user/${userId}`,
                method: 'GET',
                secure: true,
                format: 'json',
                ...params,
            }),
        };
        this.watchlist = {
            /**
             * No description
             *
             * @tags Watchlist
             * @name Add
             * @request PUT:/api/watchlist
             * @secure
             */
            add: (query, params = {}) => this.request({
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
            delete: (query, params = {}) => this.request({
                path: `/api/watchlist`,
                method: 'DELETE',
                query: query,
                secure: true,
                ...params,
            }),
        };
    }
}
exports.Api = Api;
