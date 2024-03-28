import { FC } from 'react';
import { ImportFormFilePage } from '../ImportFromFilePage';
import { Trans } from '@lingui/macro';
import { MainTitle } from '../../components/MainTitle';

export const ImportFormMediaTrackerPage: FC = () => {
  return (
    <>
      <MainTitle
        elements={[<Trans>Import</Trans>, <Trans>from backup</Trans>]}
      />

      <ImportFormFilePage
        source="MediaTracker"
        fileType="application/json"
        itemTypes={['movie', 'tv', 'episode', 'season']}
        instructions={<div>{/* <Trans></Trans> */}</div>}
      />
    </>
  );
};
