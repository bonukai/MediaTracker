export type List = {
    id: number;
    name: string;
    description?: string;
    privacy: 'public' | 'private';
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    createdAt: number;
    updatedAt: number;
    userId: number;
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
