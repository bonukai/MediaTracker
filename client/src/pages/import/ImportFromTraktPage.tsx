import { FC } from 'react';
import { MainTitle } from '../../components/MainTitle';
import { Trans } from '@lingui/macro';

export const ImportFromTraktPage: FC = () => {
  return (
    <>
      <MainTitle
        elements={[<Trans>Import</Trans>, <Trans>from Trakt</Trans>]}
      />
      Not implemented
    </>
  );
};
