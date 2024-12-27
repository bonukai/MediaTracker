import { Database } from 'src/dbconfig';
import { logger } from 'src/logger';

jest.mock('@lingui/core', () => ({
  i18n: {
    _: jest.fn(),
  },
}));

jest.spyOn(Database as any, 'knex', 'get').mockImplementation(
  () =>
    ({
      migrate: {
        latest: () => [2, ['migration', 'migration2']],
      },
    } as never)
);

describe('database config', () => {
  it('should not output any logs', async () => {
    const infoSpy = jest.spyOn(logger, 'info').mockImplementation(jest.fn());
    const httpSpy = jest.spyOn(logger, 'http').mockImplementation(jest.fn());
    const debugSpy = jest.spyOn(logger, 'debug').mockImplementation(jest.fn());
    const errorSpy = jest.spyOn(logger, 'error').mockImplementation(jest.fn());
    const warnSpy = jest.spyOn(logger, 'http').mockImplementation(jest.fn());

    await Database.runMigrations(false);

    expect(infoSpy).toBeCalledTimes(0);
    expect(debugSpy).toBeCalledTimes(0);
    expect(httpSpy).toBeCalledTimes(0);
    expect(infoSpy).toBeCalledTimes(0);
    expect(errorSpy).toBeCalledTimes(0);
    expect(warnSpy).toBeCalledTimes(0);
  });

  it('should output logs', async () => {
    const infoSpy = jest.spyOn(logger, 'info').mockImplementation(jest.fn());
    const httpSpy = jest.spyOn(logger, 'http').mockImplementation(jest.fn());
    const debugSpy = jest.spyOn(logger, 'debug').mockImplementation(jest.fn());
    const errorSpy = jest.spyOn(logger, 'error').mockImplementation(jest.fn());
    const warnSpy = jest.spyOn(logger, 'http').mockImplementation(jest.fn());

    await Database.runMigrations(true);

    expect(infoSpy).toBeCalledWith('migration');
    expect(infoSpy).toBeCalledWith('migration2');
    expect(debugSpy).toBeCalledTimes(0);
    expect(httpSpy).toBeCalledTimes(0);
    expect(errorSpy).toBeCalledTimes(0);
    expect(warnSpy).toBeCalledTimes(0);
  });

  it('should output logs', async () => {
    jest.clearAllMocks();

    const infoSpy = jest.spyOn(logger, 'info').mockImplementation(jest.fn());
    const httpSpy = jest.spyOn(logger, 'http').mockImplementation(jest.fn());
    const debugSpy = jest.spyOn(logger, 'debug').mockImplementation(jest.fn());
    const errorSpy = jest.spyOn(logger, 'error').mockImplementation(jest.fn());
    const warnSpy = jest.spyOn(logger, 'http').mockImplementation(jest.fn());

    jest.spyOn(Database as any, 'knex', 'get').mockImplementation(
      () =>
        ({
          migrate: {
            latest: () => [0, []] as never,
          },
        } as never)
    );

    await Database.runMigrations(true);

    expect(infoSpy).toBeCalledTimes(0);
    expect(debugSpy).toBeCalledTimes(0);
    expect(httpSpy).toBeCalledTimes(0);
    expect(infoSpy).toBeCalledTimes(0);
    expect(errorSpy).toBeCalledTimes(0);
    expect(warnSpy).toBeCalledTimes(0);
  });
});
