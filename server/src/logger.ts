import chalk from 'chalk';
import { readdir, readFile } from 'fs-extra';
import _ from 'lodash';
import { nanoid } from 'nanoid';
import path from 'path';
import { createLogger, format, transports, LeveledLogMethod } from 'winston';

import { LOGS_PATH } from 'src/config';

const idFormat = format((info) => {
  info.id = nanoid(36);

  return info;
});

const validationErrorLogFormatter = format((info: LogEntry) => {
  if ('type' in info && info.type === 'validationError') {
    const body =
      Object.keys(info.body).length > 0 ? JSON.stringify(info.body) : '';

    info.message = `${chalk.red('ValidationError')} ${chalk.yellow(
      `${info.method} ${info.url} ${body}`
    )} ${info.error}`;
  }

  return info;
});

const httpLogFormatter = format((info: LogEntry) => {
  if ('type' in info && info.type === 'http') {
    info.message = `${info.ip} "${chalk.magenta(
      `${info.method} ${info.url} HTTP/${info.httpVersion}`
    )}" ${info.statusCode} ${info.responseSize} ${chalk.blue(
      `${info.duration}ms`
    )}`;
  }

  return info;
});

const fileTransport = (filename: string) => {
  return new transports.File({
    filename: filename,
    maxsize: 100000,
    maxFiles: 10,
    tailable: true,
    format: format.combine(format.uncolorize(), format.json()),
    eol: '\n',
  });
};

const formats = format.combine(
  idFormat(),
  format.errors({ stack: true }),
  format.colorize(),
  format.timestamp(),
  format.prettyPrint()
);

const http = createLogger({
  level: 'http',
  format: formats,
  levels: {
    http: 3,
  },
  transports: [fileTransport(path.join(LOGS_PATH, 'http.log'))],
});

const debug = createLogger({
  level: 'debug',
  format: formats,
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 5,
  },
  transports: [
    new transports.Console({
      handleExceptions: true,
      format: format.combine(
        validationErrorLogFormatter(),
        httpLogFormatter(),
        format.cli({
          all: false,
          message: false,
          levels: {
            error: 5,
            warn: 4,
            info: 4,
            http: 4,
            debug: 5,
          },
        })
      ),
    }),
    fileTransport(path.join(LOGS_PATH, 'debug.log')),
  ],
});

export const logger: {
  [Key in 'error' | 'warn' | 'info' | 'debug']: LeveledLogMethod;
} & {
  http: (msg: HttpLogEntry) => void;
} = {
  error: (msg) => debug.error(msg),
  warn: (msg) => debug.warn(msg),
  info: (msg) => debug.info(msg),
  debug: (msg) => debug.debug(msg),
  http: (msg) => http.http('', msg),
};

export type HttpLogEntry = {
  type: 'http';
  url: string;
  method: string;
  ip: string;
  httpVersion: string;
  statusCode: number;
  responseSize: number;
  duration: number;
};

export type ValidationErrorLogEntry = {
  type: 'validationError';
  message: string;
  error: string;
  body: string;
  method: string;
  url: string;
};

export type LogEntry = {
  message: string;
  id: string;
  level: string;
  stack?: string;
  timestamp: string;
  // eslint-disable-next-line @typescript-eslint/ban-types
} & (HttpLogEntry | ValidationErrorLogEntry | {});

export type LogLevels = {
  error?: boolean;
  warn?: boolean;
  info?: boolean;
  debug?: boolean;
  http?: boolean;
};

export const getLogs = async (args: {
  levels: LogLevels;
  count?: number;
  from?: string;
}) => {
  const { levels, count, from } = args;

  const logs: LogEntry[] = _.orderBy(
    (
      await Promise.all(
        (
          await readdir(LOGS_PATH)
        )
          ?.filter((filename) => filename.match(/(debug|http)\d*.log/))
          ?.sort()
          ?.map((filename) => path.join(LOGS_PATH, filename))
          ?.map((filename) => readFile(filename, 'utf8'))
      )
    )?.flatMap((logContent) =>
      logContent
        ?.split('\n')
        ?.map((line) => line.trim())
        ?.filter((line) => line.length > 0)
        ?.map((line) => JSON.parse(line))
        ?.filter((log: LogEntry) => _.get(levels, log.level) === true)
        ?.reverse()
    ),
    (log: LogEntry) => log.timestamp,
    'desc'
  );

  if (from) {
    const start = logs.findIndex((log) => log.id === from);

    if (start !== -1) {
      return logs?.slice(start + 1, start + 1 + count || 100);
    }
  }

  return logs?.slice(0, 0 + count || 100);
};
