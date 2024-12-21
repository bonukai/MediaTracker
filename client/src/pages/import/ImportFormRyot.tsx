import { FC } from 'react';
import { ImportFormFilePage } from '../ImportFromFilePage';
import { Trans } from '@lingui/macro';
import { MainTitle } from '../../components/MainTitle';

export const ImportFormRyotPage: FC = () => {
  return (
    <>
      <MainTitle elements={[<Trans>Import</Trans>, <Trans>from Ryot</Trans>]} />

      <ImportFormFilePage
        source="Ryot"
        fileType="application/json"
        itemTypes={[
          'movie',
          'tv',
          'episode',
          'season',
          'audiobook',
          'book',
          'video_game',
        ]}
        instructions={<div></div>}
      />
    </>
  );
};
