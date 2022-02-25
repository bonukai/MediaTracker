import React, { FunctionComponent, useCallback, useState } from 'react';
import { useInfiniteQuery } from 'react-query';
import { t, Trans } from '@lingui/macro';

import { mediaTrackerApi } from 'src/api/api';
import {
  HttpLogEntry,
  LogEntry,
  ValidationErrorLogEntry,
} from 'mediatracker-api';
import { CheckboxWithTitleAndDescription } from 'src/components/Checkbox';

export const LogsPage: FunctionComponent = () => {
  const { levels, SelectLogLevelsComponent } = useSelectLogLevels();

  const { data, fetchNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery(
      ['logs', levels],
      ({ pageParam }) =>
        mediaTrackerApi.logs.get({ ...levels, from: pageParam, count: 100 }),
      {
        getNextPageParam: (lastPage) => lastPage.at(-1)?.id,
      }
    );

  if (isLoading) {
    return <Trans>Loading</Trans>;
  }

  return (
    <>
      <SelectLogLevelsComponent />
      {data?.pages
        ?.flatMap((value) => value)
        ?.map((log) => (
          <div key={log.id} className="text-md">
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
            <span className="whitespace-pre-wrap ">
              {log.stack ? (
                <ExceptionLogFormatter log={log} />
              ) : 'type' in log && log.type === 'http' ? (
                <HttpLogFormatter log={log} />
              ) : 'type' in log && log.type === 'validationError' ? (
                <ValidationErrorLogFormatter log={log} />
              ) : (
                log.message
              )}
            </span>
          </div>
        ))}
      <div className="flex justify-center mt-2">
        <button
          className="btn"
          onClick={() =>
            fetchNextPage().then(
              (data) =>
                data?.data?.pageParams?.at(-1) !== undefined &&
                data?.data?.pages?.at(-1)?.length === 0 &&
                alert(t`No more logs`)
            )
          }
          disabled={isFetchingNextPage}
        >
          Load more
        </button>
      </div>
    </>
  );
};

const useSelectLogLevels = () => {
  const [error, setError] = useState(true);
  const [warn, setWarn] = useState(true);
  const [info, setInfo] = useState(true);
  const [http, setHttp] = useState(false);
  const [debug, setDebug] = useState(true);

  const levels = {
    error: error,
    warn: warn,
    info: info,
    http: http,
    debug: debug,
  };

  const SelectLogLevelsComponent = useCallback(
    () => (
      <>
        <div className="my-4">
          <CheckboxWithTitleAndDescription
            checked={error}
            onChange={setError}
            title={t`Error`}
          />
          <CheckboxWithTitleAndDescription
            checked={warn}
            onChange={setWarn}
            title={t`Warning`}
          />
          <CheckboxWithTitleAndDescription
            checked={info}
            onChange={setInfo}
            title={t`Info`}
          />
          <CheckboxWithTitleAndDescription
            checked={http}
            onChange={setHttp}
            title={t`Http`}
          />
          <CheckboxWithTitleAndDescription
            checked={debug}
            onChange={setDebug}
            title={t`Debug`}
          />
        </div>
      </>
    ),
    [debug, error, http, info, warn]
  );

  return {
    levels: levels,
    SelectLogLevelsComponent: SelectLogLevelsComponent,
  };
};

const ExceptionLogFormatter: FunctionComponent<{ log: LogEntry }> = (props) => {
  const { log } = props;

  return <>{log.stack}</>;
};

const HttpLogFormatter: FunctionComponent<{ log: HttpLogEntry }> = (props) => {
  const { log } = props;

  return (
    <>
      {log.ip} &quot;
      <span className="text-purple-500">
        {log.method} {log.url} HTTP/{log.httpVersion}
      </span>
      &quot; {log.statusCode} {log.responseSize}{' '}
      <span className="text-blue-500">{log.duration}ms</span>
    </>
  );
};

const ValidationErrorLogFormatter: FunctionComponent<{
  log: ValidationErrorLogEntry;
}> = (props) => {
  const { log } = props;

  return (
    <>
      <span className="text-red-600">ValidationError</span>{' '}
      <span className="text-yellow-600">
        {log.method} {log.url} {JSON.stringify(log.body)}
      </span>{' '}
      {log.error}
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
