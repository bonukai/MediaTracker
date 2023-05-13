export type ListPrivacy = 'public' | 'private' | 'friends';
export type ListSortOrder = 'asc' | 'desc';
export type ListSortBy =
  | 'my-rating'
  | 'recently-added'
  | 'recently-watched'
  | 'recently-aired'
  | 'next-airing'
  | 'release-date'
  | 'runtime'
  | 'title';

export type List = {
  id: number;
  name: string;
  description?: string;
  privacy: ListPrivacy;
  sortBy?: ListSortBy;
  sortOrder?: ListSortOrder;
  createdAt: number;
  updatedAt: number;
  userId: number;
  allowComments?: boolean;
  displayNumbers?: boolean;
  isWatchlist: boolean;
  traktId?: number;
};

export type ListItem = {
  id: number;
  listId: number;
  mediaItemId: number;
  seasonId?: number;
  episodeId?: number;
  addedAt: number;
};

export const listColumns = <const>[
  'id',
  'name',
  'description',
  'privacy',
  'sortBy',
  'sortOrder',
  'createdAt',
  'updatedAt',
  'userId',
];

export const listItemColumns = <const>[
  'id',
  'listId',
  'mediaItemId',
  'seasonId',
  'episodeId',
];
