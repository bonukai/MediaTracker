import { FC } from 'react';

import { Trans } from '@lingui/macro';

import type { MediaType } from '@server/entity/mediaItemModel';
export const MediaTypeTranslation: FC<{
  mediaType: MediaType;
}> = ({ mediaType }) => {
  if (mediaType === 'audiobook') {
    return <Trans>Audiobook</Trans>;
  } else if (mediaType === 'book') {
    return <Trans>Book</Trans>;
  } else if (mediaType === 'movie') {
    return <Trans>Movie</Trans>;
  } else if (mediaType === 'tv') {
    return <Trans>TV</Trans>;
  } else if (mediaType === 'video_game') {
    return <Trans>Video game</Trans>;
  }
};
