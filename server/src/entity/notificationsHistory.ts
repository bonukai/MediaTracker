export type NotificationsHistory = {
    id?: number;
    mediaItemId: number;
    episodeId?: number;
    sendDate: number;
};

export const notificationsHistoryColumns = <const>[
    'id',
    'mediaItemId',
    'episodeId',
    'sendDate',
];
