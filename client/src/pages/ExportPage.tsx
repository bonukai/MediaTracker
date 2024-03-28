import { FC } from 'react';

import { trpc } from '../utils/trpc';
import { Trans } from '@lingui/macro';
import { MainTitle } from '../components/MainTitle';
import { downloadFile } from '../utils';
import { Button } from '../components/Button';
import { DownloadIcon } from '../components/Icons';

export const ExportPage: FC = () => {
  const exportMutation = trpc.export.json.useMutation();

  return (
    <>
      <MainTitle>
        <Trans>Export</Trans>
      </MainTitle>

      <Button
        icon={<DownloadIcon />}
        text={<Trans>Download JSON export</Trans>}
        isLoading={exportMutation.isLoading}
        onClick={async () => {
          const data = await exportMutation.mutateAsync();

          downloadFile({
            blob: new Blob([data]),
            filename: `MediaTracker.json`,
          });
        }}
      />
    </>
  );
};
