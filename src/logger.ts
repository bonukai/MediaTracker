import chalk from 'chalk';
import { addDays, formatISO, isToday } from 'date-fns';
import fs from 'fs/promises';
import _ from 'lodash';
import log from 'loglevel';
import path from 'path';

import { StaticConfiguration } from './staticConfiguration.js';

const originalFactory = log.methodFactory;

let previousTimeForClearingOldLogs: Date | undefined;
let isRunning = false;

const clearOldLogs = async (logsDirectory: string) => {
  if (
    previousTimeForClearingOldLogs &&
    isToday(previousTimeForClearingOldLogs)
  ) {
    return;
  }

  if (isRunning) {
    return;
  }

  isRunning = true;

  const allLogFiles = await fs.readdir(logsDirectory);

  const logFilesToDelete = allLogFiles
    .map((fileName) => ({
      fileName,
      date: new Date(fileName.substring(0, fileName.length - 4)),
    }))
    .filter((item) => !isNaN(item.date.getTime()))
    .filter((item) => addDays(item.date, 30) < new Date())
    .map((item) => path.join(logsDirectory, item.fileName));

  await Promise.all(logFilesToDelete.map((item) => fs.unlink(item)));
  previousTimeForClearingOldLogs = new Date();
  isRunning = false;
};

const stripAnsiStyles = (str: string) => {
  return str.replaceAll(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    ''
  );
};

const appendLogToFile = async (log: string) => {
  try {
    const now = new Date();
    const textFileLog = `${formatISO(now)} ${stripAnsiStyles(log)}\n`;
    const logFileName = `${formatISO(now, { representation: 'date' })}.txt`;

    const logsDirectory = StaticConfiguration.logsDir;
    await fs.mkdir(logsDirectory, { recursive: true });
    await fs.appendFile(path.join(logsDirectory, logFileName), textFileLog);
    await clearOldLogs(logsDirectory);
  } catch (error) {
    console.error(`failed to write logs to file: ${error}`);
  }
};

log.methodFactory = (methodName, logLevel, loggerName) => {
  const rawMethod = originalFactory(methodName, logLevel, loggerName);

  return (message) => {
    const colorFunction =
      methodName === 'info'
        ? chalk.green
        : methodName === 'error'
          ? chalk.red
          : methodName === 'debug'
            ? chalk.blue
            : methodName === 'warn'
              ? chalk.yellow
              : (value: string) => value;

    const padding = ' '.repeat(5 - methodName.length);
    const log = `${colorFunction(
      methodName.toUpperCase()
    )}:${padding} ${message}`;
    rawMethod(log);
    appendLogToFile(log);
  };
};

let enabled = false;

export const initLogger = () => {
  log.setLevel(log.getLevel());
  log.enableAll();

  enabled = true;
};

export class logger {
  static http(msg: HttpLogEntry): void {
    log.debug(msg);
  }

  static error = (msg: unknown) => {
    if (msg instanceof Error) {
      log.error(msg.stack);
    } else {
      log.error(msg);
    }
  };

  static warn = (msg: string) => {
    log.warn(msg);
  };

  static info = (msg: string) => {
    log.info(msg);
  };

  static debug = (msg: string) => {
    log.debug(msg);
  };
}

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
