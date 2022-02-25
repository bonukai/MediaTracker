import _ from 'lodash';
import { nanoid } from 'nanoid';
import path from 'path';
import { createLogger, format, transports, LeveledLogMethod } from 'winston';

import { LOGS_PATH, NODE_ENV } from 'src/config';
import {
  httpLogFormatter,
  validationErrorLogFormatter,
} from 'src/logger/formatters';

export const logWithId = format((info) => {
  info.id = nanoid(36);

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
    silent: NODE_ENV === 'test',
  });
};

const formats = format.combine(
  logWithId(),
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
      silent: NODE_ENV === 'test',
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

export type LogEntry = {
  message: string;
  id: string;
  level: string;
  stack?: string;
  timestamp: string;
  // eslint-disable-next-line @typescript-eslint/ban-types
} & (HttpLogEntry | ValidationErrorLogEntry | {});

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
  body?: Record<string, unknown>;
  method: string;
  url: string;
};

export type LogLevels = {
  error?: boolean;
  warn?: boolean;
  info?: boolean;
  debug?: boolean;
  http?: boolean;
};
