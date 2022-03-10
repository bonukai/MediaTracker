import _ from 'lodash';
import path from 'path';
import {
  createLogger,
  format,
  transports,
  LeveledLogMethod,
  Logger,
} from 'winston';

import { configMigrationLogs, Config } from 'src/config';
import {
  httpLogFormatter,
  logWithId,
  validationErrorLogFormatter,
} from 'src/logger/formatters';

const fileTransport = (filename: string) => {
  return new transports.File({
    filename: filename,
    maxsize: 100000,
    maxFiles: 10,
    tailable: true,
    format: format.combine(format.uncolorize(), format.json()),
    eol: '\n',
    silent: Config.NODE_ENV === 'test',
  });
};

export class logger {
  private static httpLogger: Logger;
  private static debugLogger: Logger;

  static init() {
    const formats = format.combine(
      logWithId(),
      format.errors({ stack: true }),
      format.colorize(),
      format.timestamp(),
      format.prettyPrint()
    );

    this.httpLogger = createLogger({
      level: 'http',
      format: formats,
      levels: {
        http: 3,
      },
      transports: [fileTransport(path.join(Config.LOGS_PATH, 'http.log'))],
    });

    this.debugLogger = createLogger({
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
          silent: Config.NODE_ENV === 'test',
        }),
        fileTransport(path.join(Config.LOGS_PATH, 'debug.log')),
      ],
    });

    configMigrationLogs().forEach(this.debugLogger.info);
  }

  static http(msg: HttpLogEntry): void {
    this.httpLogger?.http('', msg);
  }

  static error: LeveledLogMethod = (msg) => {
    return this.debugLogger?.error(msg);
  };

  static warn: LeveledLogMethod = (msg) => {
    return this.debugLogger?.warn(msg);
  };

  static info: LeveledLogMethod = (msg) => {
    return this.debugLogger?.info(msg);
  };

  static debug: LeveledLogMethod = (msg) => {
    return this.debugLogger?.debug(msg);
  };
}

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
