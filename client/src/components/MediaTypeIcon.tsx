import type {
  MediaItemResponse,
  MediaType,
} from '@server/entity/mediaItemModel';
import React, { FC } from 'react';
import {
  AudiobookIcon,
  BookIcon,
  MovieIcon,
  TvShowIcon,
  VideoGameIcon,
} from './Icons';
import { MediaTypeTranslation } from './Translations';

export const MediaTypeIcon: FC<{ mediaItem: MediaItemResponse }> = (props) => {
  const { mediaType } = props.mediaItem;

  const Icon = mediaTypeIcons[mediaType];

  return (
    <div className="px-1 py-0.5 bg-pink-100 text-sm rounded text-pink-800 w-fit select-none">
      <Icon className="h-4 fill-current" strokeWidth={20} stroke="white" />
    </div>
  );
};

export const MediaTypePill: FC<{ mediaItem: MediaItemResponse }> = (props) => {
  const { mediaType } = props.mediaItem;

  return (
    <div className="py-0.5 px-1 rounded bg-pink-100 text-pink-800 text-sm w-fit select-none">
      <MediaTypeTranslation mediaType={mediaType} />
    </div>
  );
};

const mediaTypeIcons: Record<
  MediaType,
  React.FC<React.SVGProps<SVGSVGElement>>
> = {
  tv: TvShowIcon,
  movie: MovieIcon,
  video_game: VideoGameIcon,
  book: BookIcon,
  audiobook: AudiobookIcon,
};
