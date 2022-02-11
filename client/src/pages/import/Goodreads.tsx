import React, { FunctionComponent, useState } from 'react';
import { t, Trans } from '@lingui/macro';
import { mediaTrackerApi } from 'src/api/api';
import { useMutation } from 'react-query';
import { ImportSummaryTable } from 'src/components/ImportSummaryTable';

const useGoodreadsImport = () => {
  const importMutation = useMutation(mediaTrackerApi.importGoodreads.import);

  return {
    goodreadsImport: importMutation.mutate,
    summary: importMutation.data,
    loading: importMutation.isLoading,
  };
};

export const GoodreadsImportPage: FunctionComponent = () => {
  const [rssLink, setRssLink] = useState<string>();
  const { goodreadsImport, summary, loading } = useGoodreadsImport();

  return (
    <div>
      {!summary && (
        <form
          onSubmit={(e) => {
            e.preventDefault();

            goodreadsImport({ url: rssLink });
          }}
          className="flex flex-col items-center justify-center mt-4"
        >
          <div className="mt-4 text-md">
            <Trans>
              Go to{' '}
              <a
                href="https://www.goodreads.com/review/list"
                className="link"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://www.goodreads.com/review/list
              </a>{' '}
              and copy RSS url from the bottom of the page
            </Trans>
          </div>
          <label className="my-2">
            <Trans>RSS link</Trans>
            <input
              onChange={(e) => setRssLink(e.currentTarget.value)}
              required
              type="url"
              className="block w-96"
            />
          </label>
          <button className="my-4 text-lg btn" disabled={loading}>
            <Trans>import</Trans>
          </button>
          <img src="/image/goodreads_import.png" />
        </form>
      )}
      {loading && <Trans>Importing</Trans>}
      {summary && (
        <ImportSummaryTable
          columns={[t`Books`]}
          rows={[t`Read`, t`To read`, t`Currently reading`, t`Rating`]}
          exported={[
            [summary.read],
            [summary.toRead],
            [summary.currentlyReading],
            [summary.ratings],
          ]}
          imported={[
            [summary.read],
            [summary.toRead],
            [summary.currentlyReading],
            [summary.ratings],
          ]}
        />
      )}
    </div>
  );
};
