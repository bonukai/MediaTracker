import _ from 'lodash';
import path from 'path';
import { LOGS_PATH } from 'src/config';
import { createLogger, format, transports } from 'winston';

const fileTransport = (filename: string) => {
  return new transports.File({
    filename: filename,
    maxsize: 100000,
    maxFiles: 10,
    tailable: true,
    format: format.combine(format.uncolorize(), format.json()),
  });
};

const http = createLogger({
  level: 'http',
  format: format.combine(
    format.errors({ stack: true }),
    format.colorize(),
    format.timestamp(),
    format.prettyPrint()
  ),
  levels: {
    http: 3,
  },
  transports: [fileTransport(path.join(LOGS_PATH, 'http.log'))],
});

const debug = createLogger({
  level: 'debug',
  format: format.combine(
    format.errors({ stack: true }),
    format.colorize(),
    format.timestamp(),
    format.prettyPrint()
  ),
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

export const logger = {
  error: (msg: string) => debug.error(msg),
  warn: (msg: string) => debug.warn(msg),
  info: (msg: string) => debug.info(msg),
  debug: (msg: string) => debug.debug(msg),
  http: (msg: string) => http.http(msg),
  end: () => {
    http.end();
    debug.end();
  },
  destroy: () => {
    http.destroy();
    debug.destroy();
  },
};

export type LogEntry = {
  message: string;
  level: string;
  stack?: string;
  timestamp: string;
};

export const getLogs = async () => {
  return new Promise<LogEntry[]>((resolve) => {
    debug.query(
      {
        fields: ['message', 'level', 'stack', 'timestamp'],
        order: 'desc',
        limit: 10000,
      },
      (err, results: Record<string, LogEntry[]>) => {
        resolve(_.flatten(Object.values(results)));
      }
    );
  });
};
