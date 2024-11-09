import React, { FunctionComponent, useState } from 'react';
import { t, Trans } from '@lingui/macro';
import { mediaTrackerApi } from 'src/api/api';
import { useMutation } from 'react-query';
import { CsvImportSummaryTable } from 'src/components/ImportSummaryTable';

const useCsvImport = () => {
  const importMutation = useMutation(mediaTrackerApi.importCsv.import);

  return {
    csvImport: importMutation.mutate,
    summary: importMutation.data,
    loading: importMutation.isLoading,
  };
};

export const CsvImportPage: FunctionComponent = () => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>('');
  const { csvImport, summary, loading } = useCsvImport();

  return (
    <div>
      {!summary && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const fileContent = await csvFile.text();
            csvImport({ file: fileContent })
          }}
          className="flex flex-col items-center justify-center mt-4"
        >
          <label className="my-2">
            <Trans>CSV file</Trans>
            <input
              onChange={(e) => setCsvFile(e.currentTarget.files?.[0] || null)}
              required
              type="file"
              accept=".csv"
              className="block w-96"
            />
          </label>
          <button className="my-4 text-lg btn" disabled={loading}>
            <Trans>import</Trans>
          </button>
          <div className="mt-4 text-md">
            <Trans>CSV file can have the following columns:</Trans>
            <table className="fc-theme-standard text-center">
              <tr><th>type</th><th>externalSrc</th><th>externalId</th><th>listId</th><th>watched</th><th>season</th><th>episode</th></tr>
              <tr><td>movie</td><td>imdb</td><td>tt1431045</td><td>0</td><td>Y</td><td></td><td></td></tr>
              <tr><td>movie</td><td>tmdb</td><td>293660</td><td>0</td><td>N</td><td></td><td></td></tr>
              <tr><td>tv</td><td>imdb</td><td>tt16358384</td><td>0</td><td>Y</td><td>1</td><td>5</td></tr>
              <tr><td>tv</td><td>tmdb</td><td>153312</td><td>0</td><td>N</td><td></td><td></td></tr>
              <tr><td>tv</td><td>tvdb</td><td>413215</td><td>0</td><td>N</td><td></td><td></td></tr>
              <tr><td>game</td><td>igdb</td><td>133004</td><td>0</td><td>N</td><td></td><td></td></tr>
              <tr><td>book</td><td>openlibrary</td><td>OL27332147M</td><td>0</td><td>N</td><td></td><td></td></tr>
              <tr><td>audiobook</td><td>audible</td><td>197498043X</td><td>0</td><td>N</td><td></td><td></td></tr>
            </table>
          </div>
          <div className="mt-4 text-md">
            <ul className="list-disc">
            <li><Trans>Header row is mandatory</Trans></li>
            <li><Trans>Mandatory columns are (in any order): type, externalSrc, externalId</Trans></li>
            <li><Trans>The rest are optional and can be omitted, but data must be consistent</Trans></li>
            <li><Trans>The header row will determine the column ordering of <i>all</i> data rows</Trans></li>            
            <li><Trans>Watched is a Y/N column that will set the item <i>Seen</i> status to true</Trans></li>
            <li><Trans>ListId can be set to 0, blank or omitted to ignore</Trans></li>
            <li><Trans>Watchlist has a listId, get its id from the Lists page</Trans></li>
            <li><Trans>A row can be duplicated to add an item to multiple lists,<br/>but only need to set watched=Y once</Trans></li>
            <li><Trans>Movies can use either imdb or tmdb ids</Trans></li>
            <li><Trans>TV shows can use imdb, tmdb or tvdb ids</Trans></li>
            <li><Trans>TV should only use the main <i>Show</i> id, not a single season or episode id</Trans></li>
            <li><Trans>Set the season and episode to mark a TV show as watched up to that episode,<br/>otherwise the entire show will be marked as watched</Trans></li>
            </ul>
          </div>
        </form>
      )}
      {loading && <Trans>Importing</Trans>}
      {summary && (
        <CsvImportSummaryTable
          rows={[
            {
              title: t`MediaItems`,
              imported: {
                movie: summary.movie,
                tv: summary.tv,
                season: summary.season,
                episode: summary.episode,
                video_game: summary.video_game,
                book: summary.book,
                audiobook: summary.audiobook
              },
            }
          ]}
        />
      )}
    </div>
  );
};
