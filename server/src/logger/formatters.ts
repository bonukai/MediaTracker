import chalk from 'chalk';
import _ from 'lodash';
import { nanoid } from 'nanoid';
import { format } from 'winston';

import { LogEntry } from 'src/logger';

export const logWithId = format((info) => {
  info.id = nanoid(36);

  return info;
});

export const validationErrorLogFormatter = format((info: LogEntry) => {
  if ('type' in info && info.type === 'validationError') {
    const body =
      info.body && Object.keys(info.body).length > 0
        ? JSON.stringify(info.body)
        : '';

    info.message = `${chalk.red('ValidationError')} ${chalk.yellow(
      `${info.method} ${info.url} ${body}`
    )} ${info.error}`;
  }

  return info;
});

export const httpLogFormatter = format((info: LogEntry) => {
  if ('type' in info && info.type === 'http') {
    info.message = `${info.ip} "${chalk.magenta(
      `${info.method} ${info.url} HTTP/${info.httpVersion}`
    )}" ${info.statusCode} ${info.responseSize} ${chalk.blue(
      `${info.duration}ms`
    )}`;
  }

  return info;
});
