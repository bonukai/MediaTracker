export type Seen = {
    id?: number;
    date: number;
    mediaItemId: number;
    seasonId?: number;
    episodeId?: number;
    userId: number;
};

export const seenColumns = <const>[
    'date',
    'id',
    'mediaItemId',
    'seasonId',
    'episodeId',
    'userId',
];

export class SeenFilters {
    public static mediaItemSeenValue = (seen: Seen) => {
        return Boolean(!seen.episodeId);
    };

    public static episodeSeenValue = (seen: Seen) => {
        return Boolean(seen.episodeId);
    };
}
