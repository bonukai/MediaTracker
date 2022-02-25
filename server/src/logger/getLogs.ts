import { readdir, readFile } from 'fs-extra';
import _ from 'lodash';
import path from 'path';

import { LOGS_PATH } from 'src/config';
import { LogEntry, LogLevels } from 'src/logger';

export const getLogs = async (args?: {
  levels?: LogLevels;
  count?: number;
  from?: string;
}) => {
  const { levels, count, from } = _.merge(
    {
      count: 100,
      levels: {
        error: true,
        warn: true,
        info: true,
        debug: true,
        http: true,
      },
    },
    args
  );

  const logs: LogEntry[] = (
    await Promise.all(
      (
        await readdir(LOGS_PATH)
      )
        ?.filter((filename) => filename.match(/(debug|http)\d*.log/))
        ?.sort()
        ?.map((filename) => path.join(LOGS_PATH, filename))
        ?.map((filename) => readFile(filename, 'utf8'))
    )
  )
    ?.flatMap((logContent) =>
      logContent
        ?.split('\n')
        ?.map((line) => line.trim())
        ?.filter((line) => line.length > 0)
        ?.map((line) => JSON.parse(line))
        ?.filter((log: LogEntry) => _.get(levels, log.level) === true)
        ?.reverse()
    )
    ?.sort((a: LogEntry, b: LogEntry) =>
      b.timestamp.localeCompare(a.timestamp)
    );

  if (from) {
    const start = logs.findIndex((log) => log.id === from);

    if (start !== -1) {
      return logs?.slice(start + 1, start + 1 + count);
    } else {
      return [];
    }
  }

  return logs?.slice(0, 0 + count);
};
