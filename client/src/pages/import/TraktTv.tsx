import React, { FunctionComponent, useState } from 'react';
import { useQuery } from 'react-query';
import { Spring } from 'react-spring';
import { t, Trans } from '@lingui/macro';

import { mediaTrackerApi } from 'src/api/api';
import { ImportState } from 'mediatracker-api';
import { ImportSummaryTable } from 'src/components/ImportSummaryTable';

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
          <ImportSummaryTable
            columns={[t`Movies`, t`Shows`, t`Seasons`, t`Episodes`]}
            rows={[t`Watchlist`, t`Seen history`, t`Ratings`]}
            exported={[
              [
                state.exportSummary?.watchlist?.movies,
                state.exportSummary?.watchlist?.shows,
                null,
                null,
              ],
              [
                state.exportSummary?.seen?.movies,
                null,
                null,
                state.exportSummary?.seen?.episodes,
                ,
              ],
              [
                state.exportSummary?.ratings?.movies,
                state.exportSummary?.ratings?.shows,
                state.exportSummary?.ratings?.seasons,
                state.exportSummary?.ratings?.episodes,
              ],
            ]}
            imported={[
              [
                state.importSummary?.watchlist?.movies,
                state.importSummary?.watchlist?.shows,
                null,
                null,
              ],
              [
                state.importSummary?.seen?.movies,
                null,
                null,
                state.importSummary?.seen?.episodes,
                ,
              ],
              [
                state.importSummary?.ratings?.movies,
                state.importSummary?.ratings?.shows,
                state.importSummary?.ratings?.seasons,
                state.importSummary?.ratings?.episodes,
              ],
            ]}
          />
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
