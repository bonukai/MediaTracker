import { httpLogFormatter } from 'src/logger/formatters';

describe('httpLogFormatter', () => {
  it('should use all properties in a message', () => {
    const logEntry = {
      level: 'http',
      message: '',
      method: 'POST',
      url: '/api/foo',
      duration: 123,
      httpVersion: '1.1',
      ip: '127.0.0.1',
      responseSize: 456,
      statusCode: 200,
      type: 'http',
    };

    const res = httpLogFormatter().transform(logEntry);

    const message = typeof res === 'object' ? res.message : undefined;

    expect(message).toContain(logEntry.method);
    expect(message).toContain(logEntry.url);
    expect(message).toContain(logEntry.duration.toString());
    expect(message).toContain(logEntry.httpVersion);
    expect(message).toContain(logEntry.ip);
    expect(message).toContain(logEntry.responseSize.toString());
    expect(message).toContain(logEntry.statusCode.toString());
  });

  it('should return untouched object if it is not a HttpLog', () => {
    const info = {
      level: 'http',
      message: 'message',
      method: 'POST',
      url: '/api/foo',
      duration: 123,
      httpVersion: '1.1',
      ip: '127.0.0.1',
      responseSize: 456,
      statusCode: 200,
    };

    const res = httpLogFormatter().transform(info);

    expect(res).toEqual(info);
  });
});
