export type Seen = {
    id?: number;
    date: number;
    mediaItemId: number;
    episodeId?: number;
    progress?: number;
    duration?: number;
    startedAt?: number;
    action?: string;
    userId: number;
};

export const seenColumns = <const>[
    'date',
    'id',
    'mediaItemId',
    'episodeId',
    'userId',
    'action',
    'duration',
    'progress',
    'startedAt',
];

export class SeenFilters {
    public static mediaItemSeenValue = (seen: Seen) => {
        return Boolean(!seen.episodeId);
    };

    public static episodeSeenValue = (seen: Seen) => {
        return Boolean(seen.episodeId);
    };
}
