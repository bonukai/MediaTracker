export type Watchlist = {
    id?: number;
    mediaItemId: number;
    userId: number;
};

export const watchlistColumns = <const>['id', 'mediaItemId', 'userId'];
