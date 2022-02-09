export type Watchlist = {
  id?: number;
  mediaItemId: number;
  userId: number;
  addedAt?: number;
};

export const watchlistColumns = <const>[
  'id',
  'mediaItemId',
  'userId',
  'addedAt',
];
