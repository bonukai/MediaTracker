import { join, resolve } from 'path';
import { homedir } from 'os';
import fs from 'fs-extra';

import { Config } from 'src/config';

const oldImgPath = resolve('img');
const oldLogsPath = resolve('logs');
const oldDatabasePath = resolve('data.db');

const newImgPath = join(homedir(), '.mediatracker/img');
const newLogsPath = join(homedir(), '.mediatracker/logs');
const newDatabasePath = join(homedir(), '.mediatracker/data.db');

describe('config', () => {
  test('default paths', () => {
    expect(Config.ASSETS_PATH).toBe(newImgPath);
    expect(Config.LOGS_PATH).toBe(newLogsPath);
  });

  test('migrate', () => {
    jest.spyOn(fs, 'existsSync').mockImplementation((path) => {
      if (
        path === join(homedir(), '.mediatracker') ||
        path === newImgPath ||
        path === newLogsPath ||
        path === newDatabasePath
      ) {
        return false;
      }

      if (
        path === oldImgPath ||
        path === oldLogsPath ||
        path === oldDatabasePath
      ) {
        return true;
      }

      throw new Error('Not implemented');
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(fs, 'statSync').mockImplementation((path): any => {
      if (path === oldImgPath || path === oldLogsPath) {
        return {
          isDirectory: () => true,
        };
      }

      if (path === oldDatabasePath) {
        return {
          isFile: () => true,
        };
      }

      throw new Error('Not implemented');
    });

    const moveSyncSpy = jest.spyOn(fs, 'moveSync').mockImplementation(jest.fn);

    Config.migrate();

    expect(moveSyncSpy).toBeCalledWith(oldImgPath, newImgPath);
    expect(moveSyncSpy).toBeCalledWith(oldLogsPath, newLogsPath);
  });
});
