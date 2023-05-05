export type Progress = {
  id?: number;
  date: number;
  mediaItemId: number;
  episodeId?: number;
  userId: number;
  progress?: number;
  duration?: number;
  action?: 'playing' | 'paused';
  device?: string;
};

export const progressColumns = <const>[
  'id',
  'date',
  'mediaItemId',
  'episodeId',
  'userId',
  'duration',
  'progress',
  'action',
  'device',
];
