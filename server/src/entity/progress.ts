import { MediaType } from 'src/entity/mediaItem';

export type ProgressAction = 'playing' | 'paused';

export type Progress = {
  id?: number;
  date: number;
  mediaItemId: number;
  episodeId?: number;
  userId: number;
  progress?: number;
  duration?: number;
  action?: ProgressAction;
  device?: string;
};

export type ProgressExtended = Progress & {
  mediaType: MediaType;
  tmdbId?: number;
  seasonNumber?: number;
  episodeNumber?: number;
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
