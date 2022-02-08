import React, { FunctionComponent, useState } from 'react';
import { useQuery } from 'react-query';
import { Spring } from 'react-spring';

import { mediaTrackerApi } from 'src/api/api';
import { ImportState, Summary } from 'mediatracker-api';
import { t, Trans } from '@lingui/macro';

const useTraktTvImport = () => {
  const [_state, setState] = useState<ImportState>();

  const { data: deviceCode } = useQuery(
    ['import', 'TraktTv', 'device-code'],
    mediaTrackerApi.importTrakttv.deviceToken
  );

  const { data: state } = useQuery(
    ['import', 'TraktTv', 'state'],
    mediaTrackerApi.importTrakttv.state,
    {
      refetchInterval: 100,
      enabled: _state !== 'imported',
      onSettled: (data) => setState(data?.state),
    }
  );

  return {
    deviceCode,
    state,
  };
};

export const TraktTvImportPage: FunctionComponent = () => {
  const { deviceCode, state } = useTraktTvImport();

  return (
    <div className="flex flex-col justify-center w-full mt-4">
      <div className="flex flex-col items-center w-full">
        {state ? (
          <>
            {deviceCode && state?.state === 'waiting-for-authentication' ? (
              <div className="">
                <Trans>
                  Go to{' '}
                  <a
                    href={deviceCode.verificationUrl}
                    className="text-blue-800 underline dark:text-blue-400"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {deviceCode.verificationUrl}
                  </a>{' '}
                  and enter following code: {deviceCode.userCode}
                </Trans>
                <div
                  className="ml-2 text-sm btn"
                  onClick={() => {
                    navigator.permissions
                      .query({ name: 'clipboard-write' as PermissionName })
                      .then((result) => {
                        if (
                          result.state == 'granted' ||
                          result.state == 'prompt'
                        ) {
                          navigator.clipboard.writeText(deviceCode.userCode);
                        }
                      });
                  }}
                >
                  <Trans>Copy to clipboard</Trans>
                </div>
              </div>
            ) : (
              <>
                <div className="text-2xl">{stateMap[state.state]}</div>
              </>
            )}
          </>
        ) : (
          <Trans>Loading</Trans>
        )}
        <div className="py-4">
          {state?.progress > 0 && (
            <Spring
              from={{ percent: 0 }}
              to={{ percent: state.progress * 100 }}
            >
              {({ percent }) => (
                <div
                  className="block h-4 border rounded w-80 bg-grad"
                  style={{
                    background: `linear-gradient(to right, black ${percent}%, transparent ${percent}%)`,
                  }}
                />
              )}
            </Spring>
          )}
        </div>
        {state?.exportSummary && (
          <>
            <div className="my-2 text-2xl">
              <Trans>Summary</Trans>
            </div>
            <SummaryTable
              exported={state.exportSummary}
              imported={state.importSummary}
            />
          </>
        )}
      </div>
    </div>
  );
};

const stateMap: Record<ImportState, string> = {
  exporting: t`Exporting`,
  uninitialized: t`Uninitialized`,
  'updating-metadata': t`Updating metadata`,
  'waiting-for-authentication': t`Waiting for authentication`,
  imported: t`Imported`,
  importing: t`Importing`,
};

const TableCell: FunctionComponent<{ imported?: number; exported: number }> = (
  props
) => {
  const { imported, exported } = props;

  if (!exported) {
    return <></>;
  }

  return (
    <>
      {imported || '?'} / {exported}
    </>
  );
};

const SummaryTable: FunctionComponent<{
  exported: Summary;
  imported?: Summary;
}> = (props) => {
  const { exported, imported } = props;

  return (
    <table className="w-full divide-y divide-gray-300 table-auto">
      <thead className="text-lg font-semibold ">
        <tr className="divide-x">
          <th></th>
          <th>
            <Trans>Movies</Trans>
          </th>
          <th>
            <Trans>Shows</Trans>
          </th>
          <th>
            <Trans>Seasons</Trans>
          </th>
          <th>
            <Trans>Episodes</Trans>
          </th>
        </tr>
      </thead>
      <tbody className="text-sm divide-y ">
        <tr className="divide-x ">
          <td>
            <Trans>Watchlist</Trans>
          </td>
          <td className="text-center">
            <TableCell
              imported={imported?.watchlist.movies}
              exported={exported.watchlist.movies}
            />
          </td>
          <td className="text-center">
            <TableCell
              imported={imported?.watchlist.shows}
              exported={exported.watchlist.shows}
            />
          </td>
          <td></td>
          <td></td>
        </tr>
        <tr className="divide-x ">
          <td>
            <Trans>Seen history</Trans>
          </td>
          <td className="text-center">
            <TableCell
              imported={imported?.seen.movies}
              exported={exported.seen.movies}
            />
          </td>
          <td></td>
          <td></td>
          <td className="text-center">
            <TableCell
              imported={imported?.seen.episodes}
              exported={exported.seen.episodes}
            />
          </td>
        </tr>
        <tr className="divide-x ">
          <td>
            <Trans>Ratings</Trans>
          </td>
          <td className="text-center">
            <TableCell
              imported={imported?.ratings.movies}
              exported={exported.ratings.movies}
            />
          </td>
          <td className="text-center">
            <TableCell
              imported={imported?.ratings.shows}
              exported={exported.ratings.shows}
            />
          </td>
          <td className="text-center">
            <TableCell
              imported={imported?.ratings.seasons}
              exported={exported.ratings.seasons}
            />
          </td>
          <td className="text-center">
            <TableCell
              imported={imported?.ratings.episodes}
              exported={exported.ratings.episodes}
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
};
