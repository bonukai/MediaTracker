import { join, resolve } from 'path';
import { homedir } from 'os';
import fs, { StatSyncFn } from 'fs-extra';

jest.mock('src/config', () => {
  const r = {
    ...jest.requireActual('src/config'),
    Config: {
      ...jest.requireActual('src/config').Config,
      validate: jest.requireActual('src/config').Config.validate,
      migrate: jest.requireActual('src/config').Config.migrate,
      AUDIBLE_LANG: 'abc',
    },
  };

  return r;
});

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

  afterEach(jest.clearAllMocks);

  test('should copy directories to new config', () => {
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

    jest.spyOn(fs, 'statSync').mockImplementation(((path: string) => {
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
    }) as unknown as StatSyncFn);

    const moveSyncSpy = jest.spyOn(fs, 'moveSync').mockImplementation(jest.fn);

    Config.migrate();

    expect(moveSyncSpy).toBeCalledWith(oldImgPath, newImgPath);
    expect(moveSyncSpy).toBeCalledWith(oldLogsPath, newLogsPath);
  });

  test('should do nothing if new config directory exists', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);

    const statSyncSpy = jest
      .spyOn(fs, 'statSync')
      .mockImplementation(jest.fn as unknown as StatSyncFn);
    const moveSyncSpy = jest.spyOn(fs, 'moveSync').mockImplementation(jest.fn);

    Config.migrate();

    expect(statSyncSpy).toBeCalledTimes(0);
    expect(moveSyncSpy).toBeCalledTimes(0);
  });

  test('validate should throw on invalid option', () => {
    expect(() => Config.validate()).toThrowError(/AUDIBLE_LANG.*abc/);
  });
});
