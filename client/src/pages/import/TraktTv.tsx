import React, { FunctionComponent, useEffect, useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { Spring } from 'react-spring';
import { t, Trans } from '@lingui/macro';

import { mediaTrackerApi } from 'src/api/api';
import { ImportState, ImportTrakttv } from 'mediatracker-api';
import { TvImportSummaryTable } from 'src/components/ImportSummaryTable';
import { queryClient } from 'src/App';

const useTraktTvImport = () => {
  const [_state, setState] = useState<ImportState>();

  const { data: deviceCode } = useQuery(
    ['import', 'TraktTv', 'device-code'],
    mediaTrackerApi.importTrakttv.deviceToken
  );

  const [state, setStateResponse] =
    useState<ImportTrakttv.State.ResponseBody>();

  useEffect(() => {
    const events = new EventSource('/api/import-trakttv/state-stream');

    events.onmessage = (event) => {
      setStateResponse(JSON.parse(event.data));
    };

    return () => {
      events.close();
    };
  }, []);

  const startOverMutation = useMutation(
    () => mediaTrackerApi.importTrakttv.startOver(),
    {
      onSettled: () => {
        setState(undefined);
        queryClient.removeQueries(['import', 'TraktTv']);
        queryClient.invalidateQueries(['import', 'TraktTv']);
      },
    }
  );

  return {
    deviceCode,
    state,
    startOver: startOverMutation.mutate,
  };
};

export const TraktTvImportPage: FunctionComponent = () => {
  const { deviceCode, state, startOver } = useTraktTvImport();

  return (
    <div className="flex flex-col justify-center w-full mt-4">
      <div className="flex flex-col items-center w-full">
        {state ? (
          <>
            {deviceCode && state?.state === 'waiting-for-authentication' ? (
              <div className="flex flex-col items-center mt-10">
                <div>
                  <Trans>
                    Go to{' '}
                    <a
                      href={deviceCode.verificationUrl}
                      className="link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {deviceCode.verificationUrl}
                    </a>{' '}
                    and enter following code: <b>{deviceCode.userCode}</b>
                  </Trans>
                </div>
                {navigator.clipboard && (
                  <div>
                    <div
                      className="mt-2 text-sm btn"
                      onClick={async () => {
                        try {
                          navigator.clipboard.writeText(deviceCode.userCode);
                        } catch (error) {
                          console.log(error);
                        }
                      }}
                    >
                      <Trans>Copy to clipboard</Trans>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="text-2xl">{stateMap[state.state]}</div>
                {state.error && (
                  <div className="mt-2 text-red-500">{state.error}</div>
                )}
              </>
            )}

            {state.state === 'imported' && (
              <>
                <div className="mt-2 btn" onClick={() => startOver()}>
                  <Trans>Start over</Trans>
                </div>
              </>
            )}
          </>
        ) : (
          <Trans>Loading</Trans>
        )}
        <div className="py-4">
          {state?.progress > 0 && (
            <ProgressBarComponent progress={state.progress} />
          )}
        </div>

        {state?.exportSummary && (
          <TraktImportSummaryTableComponent state={state} />
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
  error: t`Error`,
};

const ProgressBarComponent: FunctionComponent<{ progress: number }> = (
  props
) => {
  const { progress } = props;

  return (
    <Spring from={{ percent: 0 }} to={{ percent: progress * 100 }}>
      {({ percent }) => (
        <div
          className="block h-4 border rounded w-80 bg-grad"
          style={{
            background: `linear-gradient(to right, black ${percent}%, transparent ${percent}%)`,
          }}
        />
      )}
    </Spring>
  );
};

const TraktImportSummaryTableComponent: FunctionComponent<{
  state: ImportTrakttv.State.ResponseBody;
}> = (props) => {
  const { state } = props;

  const importedListsByTraktId =
    state.importSummary?.lists.reduce(
      (prev, current) => ({ [current.listId]: current, ...prev }),
      {}
    ) || {};

  return (
    <>
      <TvImportSummaryTable
        rows={[
          {
            title: t`Watchlist`,
            exported: {
              movies: state.exportSummary?.watchlist?.movies,
              shows: state.exportSummary?.watchlist?.shows,
              seasons: state.exportSummary?.watchlist?.seasons,
              episodes: state.exportSummary?.watchlist?.episodes,
            },
            imported: {
              movies: state.importSummary?.watchlist?.movies,
              shows: state.importSummary?.watchlist?.shows,
              seasons: state.importSummary?.watchlist?.seasons,
              episodes: state.importSummary?.watchlist?.episodes,
            },
          },
          {
            title: t`Seen history`,
            exported: {
              movies: state.exportSummary?.seen?.movies,
              episodes: state.exportSummary?.seen?.episodes,
            },
            imported: {
              movies: state.importSummary?.seen?.movies,
              episodes: state.importSummary?.seen?.episodes,
            },
          },
          {
            title: t`Ratings`,
            exported: {
              movies: state.exportSummary?.ratings?.movies,
              shows: state.exportSummary?.ratings?.shows,
              seasons: state.exportSummary?.ratings?.seasons,
              episodes: state.exportSummary?.ratings?.episodes,
            },
            imported: {
              movies: state.importSummary?.ratings?.movies,
              shows: state.importSummary?.ratings?.shows,
              seasons: state.importSummary?.ratings?.seasons,
              episodes: state.importSummary?.ratings?.episodes,
            },
          },
          ...state.exportSummary?.lists?.map((list) => ({
            key: list.listId,
            title: t`List: ${list.listName}`,
            exported: {
              movies: list?.movies,
              shows: list?.shows,
              seasons: list?.seasons,
              episodes: list?.episodes,
            },
            imported: {
              movies: importedListsByTraktId[list.listId]?.movies,
              shows: importedListsByTraktId[list.listId]?.shows,
              seasons: importedListsByTraktId[list.listId]?.seasons,
              episodes: importedListsByTraktId[list.listId]?.episodes,
            },
          })),
        ]}
      />
    </>
  );
};
