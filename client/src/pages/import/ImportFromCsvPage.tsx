import { FC } from 'react';
import { ImportFormFilePage } from '../ImportFromFilePage';
import { Trans } from '@lingui/macro';
import { MainTitle } from '../../components/MainTitle';

export const ImportFromCsvPage: FC = () => {
  return (
    <>
      <MainTitle
        elements={[<Trans>Import</Trans>, <Trans>from CSV</Trans>]}
      />

      <ImportFormFilePage
        source="CSV"
        fileType="text/csv"
        itemTypes={['movie', 'tv']}
        instructions={<div>{
          <CsvInstructions />
        }</div>}
      />
    </>
  );
};

const CsvInstructions: FC = () => {
  
  //workaround because react and the ligui lib process escapes differently
  const newline = '\\n';
  
  return (
    <details className="instructions">
      <summary className="instructions-summary">
        <Trans>Click to show CSV file requirements</Trans>
      </summary>
      <div className="instructions-content">
        <ul className="ml-8 list-decimal">
          <li><Trans>Comma delimited, plain UTF-8 files only</Trans></li>
          <li><Trans>Quote and escape characters are optional but must use double quotes: "</Trans></li>
          <li><Trans>Windows (\r{newline}), Linux ({newline}) and old macOS (\r) record delimiters are auto-detected</Trans></li>
          <li><Trans>The first line MUST be column headers</Trans></li>
          <li>
            <Trans>Allowed column headers are, in any order and case-insensitive:</Trans><br/>
            <code>type, imdbId, tmdbId, tvdbId, listId, rating, seen, season, episode</code>
          </li>
          <li><Trans>The only mandatory column is</Trans> <code>type</code></li>
          <li>
            <Trans>Valid values for <code>type</code> are:</Trans><br/>
            <code>tv, movie</code>
          </li>
          <li>
            <Trans>Other columns are optional, but you must include at least one of:</Trans><br/>
            <code>tmdbId, imdbId, tvdbId</code>
          </li>
          <li><Trans>Leading and trailing whitespaces are stripped</Trans></li>
          <li><Trans>Any record that cannot be parsed or contains errors will be skipped</Trans></li>
          <li><Trans>Any record with missing fields compared to header will be skipped</Trans></li>
          <li><Trans>List IDs must exist and be owned by the user</Trans></li>
          <li><Trans>Items with invalid or other users list IDs are discarded</Trans></li>
          <li><Trans>The watchlist list ID is found on the Lists page</Trans></li>
          <li><Trans>Seen is a Y/N column only</Trans></li>
          <li>
            <Trans>Movies will be looked up in this order:</Trans><br />
            <code>tmdbId, imdbId</code>
          </li>
          <li>
            <Trans>TV shows will be looked up in this order:</Trans><br />
            <code>tmdbId, imdbId, tvdbId</code>
          </li>
          <li><Trans>TV shows must only use the show's main ID from tvdb, tmdb, or imdb</Trans></li>
          <li>
            <Trans>To set episodes of a TV show as Seen, must provide a record for each:</Trans><br />
            <code>season</code> <Trans>and</Trans> <code>episode</code>
          </li>
          <li><Trans>Valid ratings are decimal values between 0.1 and 10.0</Trans></li>
          <li>
            <Trans>If you use "out of 5" ratings, multiply the value by 2</Trans><br/>
            <Trans>Eg: for a rating of 4 out of 5, provide a value of 8</Trans>
          </li>
        </ul>
      </div>
    </details>
  );
};
