import { FC } from 'react';
import { ImportFormFilePage } from '../ImportFromFilePage';
import { Trans } from '@lingui/macro';
import { MainTitle } from '../../components/MainTitle';

export const ImportFromFloxPage: FC = () => {
  return (
    <>
      <MainTitle elements={[<Trans>Import</Trans>, <Trans>from Flox</Trans>]} />
      <ImportFormFilePage
        source="Flox"
        fileType="application/json"
        itemTypes={['movie', 'tv', 'episode']}
        instructions={
          <div>
            <Trans>
              <i>Settings</i> ➡️ <i>Backup</i> ➡️ <i>Export movies</i>
            </Trans>
          </div>
        }
      />
    </>
  );
};
