import { FC } from 'react';
import { ImportFormFilePage } from '../ImportFromFilePage';
import { Trans } from '@lingui/macro';
import { MainTitle } from '../../components/MainTitle';

export const ImportFromSimklPage: FC = () => {
  return (
    <>
      <MainTitle
        elements={[<Trans>Import</Trans>, <Trans>from Simkl</Trans>]}
      />
      <ImportFormFilePage
        source="Simkl"
        fileType="application/json"
        itemTypes={['movie', 'tv', 'episode', 'season']}
        instructions={
          <div>
            <div>
              <Trans>
                Download backup from{' '}
                <a href="https://simkl.com/apps/backup/" target="_">
                  Simkl
                </a>
              </Trans>
            </div>
            <Trans>
              If you do not have a VIP account, send an email to{' '}
              <a
                className="underline text-sky-600"
                href="mailto:support@simkl.com?subject=GDPR%20Data%20Request&body=Hi%2C%20I%20would%20like%20to%20receive%20a%20copy%20of%20my%20data%20according%20to%20GDPR%20laws."
              >
                support@simkl.com
              </a>
            </Trans>
          </div>
        }
      />
    </>
  );
};
