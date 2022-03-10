import { HttpLogEntry, logger } from 'src/logger';
import { logWithId } from 'src/logger/formatters';
import winston, { Logger } from 'winston';

describe('logger', () => {
  it('logWithId', () => {
    const res = logWithId().transform({
      level: 'info',
      message: 'message',
    });

    expect(
      typeof res === 'object' && 'id' in res && typeof res.id === 'string'
    ).toBeTruthy();
  });

  it('logger', () => {
    const infoSpy = jest.fn();
    const httpSpy = jest.fn();
    const debugSpy = jest.fn();
    const errorSpy = jest.fn();
    const warnSpy = jest.fn();

    const createLoggerSpy = jest
      .spyOn(winston, 'createLogger')
      .mockImplementation(
        () =>
          ({
            info: infoSpy,
            http: httpSpy,
            debug: debugSpy,
            error: errorSpy,
            warn: warnSpy,
          } as unknown as Logger)
      );

    const httpLog: HttpLogEntry = {
      duration: 1,
      httpVersion: '1.1',
      ip: '127.0.0.1',
      method: 'GET',
      responseSize: 2,
      statusCode: 200,
      type: 'http',
      url: '/',
    };

    logger.init();
    logger.info('info');
    logger.debug('debug');
    logger.error('error');
    logger.warn('warn');
    logger.http(httpLog);

    expect(createLoggerSpy).toBeCalled();
    expect(infoSpy).toBeCalledWith('info');
    expect(debugSpy).toBeCalledWith('debug');
    expect(infoSpy).toBeCalledWith('info');
    expect(warnSpy).toBeCalledWith('warn');
    expect(warnSpy).toBeCalledWith('warn');
    expect(httpSpy).toBeCalledWith('', httpLog);

    jest.clearAllMocks();
  });
});
