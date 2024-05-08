import { FC } from 'react';
import { ImportFormFilePage } from '../ImportFromFilePage';
import { Trans } from '@lingui/macro';
import { MainTitle } from '../../components/MainTitle';

export const ImportFromGoodreadsPage: FC = () => {
  return (
    <>
      <MainTitle
        elements={[<Trans>Import</Trans>, <Trans>from Goodreads</Trans>]}
      />
      <ImportFormFilePage
        source="Goodreads"
        fileType="text/csv"
        itemTypes={['book']}
        instructions={
          <div>
            <Trans>
              Download backup from{' '}
              <a href="https://www.goodreads.com/review/import" target="_">
                Goodreads
              </a>
            </Trans>
          </div>
        }
      />
    </>
  );
};
