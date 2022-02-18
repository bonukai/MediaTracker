export type Seen = {
  id?: number;
  date: number;
  mediaItemId: number;
  episodeId?: number;
  userId: number;

  type: 'progress' | 'seen';
  progress?: number;
  duration?: number;
  action?: 'paused' | 'playing';
};

export const seenColumns = <const>[
  'date',
  'id',
  'mediaItemId',
  'episodeId',
  'userId',
  'type',
  'progress',
  'duration',
  'action',
];

export class SeenFilters {
  public static mediaItemSeenValue = (seen: Seen) => {
    return Boolean(!seen.episodeId);
  };

  public static episodeSeenValue = (seen: Seen) => {
    return Boolean(seen.episodeId);
  };
}
