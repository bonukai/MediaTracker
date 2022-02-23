import React, { FunctionComponent } from 'react';
import { useQuery } from 'react-query';
import { Trans } from '@lingui/macro';

import { mediaTrackerApi } from 'src/api/api';

export const LogsPage: FunctionComponent = () => {
  const { data, isLoading } = useQuery('logs', mediaTrackerApi.logs.get);

  if (isLoading) {
    return <Trans>Loading</Trans>;
  }

  return (
    <>
      {data.map((log) => (
        <div key={log.timestamp} className="text-md">
          <span className="mr-2 text-sm">
            {new Date(log.timestamp).toLocaleString()}
          </span>
          <span
            style={{ color: logLevelToColorMap[log.level] }}
            className="text-md"
          >
            {log.level}
          </span>
          :{' '}
          <span className="whitespace-pre-wrap">
            {log.stack || log.message}
          </span>
        </div>
      ))}
    </>
  );
};

const logLevelToColorMap = {
  error: 'red',
  info: 'green',
  warning: 'yellow',
  debug: 'blue',
  http: 'rgb(174 125 58)',
};
