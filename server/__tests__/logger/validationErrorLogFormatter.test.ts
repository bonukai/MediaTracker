import { validationErrorLogFormatter } from 'src/logger/formatters';

describe('validationErrorLogFormatter', () => {
  it('should use all properties in a message', () => {
    const logEntry = {
      level: 'error',
      message: 'message',
      error: 'error text',
      method: 'POST',
      type: 'validationError',
      url: '/api/foo',
    };

    const res = validationErrorLogFormatter().transform(logEntry);

    const message = typeof res === 'object' ? res.message : undefined;

    expect(message).toContain(logEntry.error);
    expect(message).toContain(logEntry.message);
    expect(message).toContain(logEntry.method);
    expect(message).toContain(logEntry.url);
  });

  it('should use all properties in a message with a body', () => {
    const logEntry = {
      level: 'error',
      message: 'message',
      error: 'error text',
      body: {
        key: 'value',
      },
      method: 'POST',
      type: 'validationError',
      url: '/api/foo',
    };

    const res = validationErrorLogFormatter().transform(logEntry);

    const message = typeof res === 'object' ? res.message : undefined;

    expect(message).toContain(logEntry.error);
    expect(message).toContain(logEntry.message);
    expect(message).toContain(logEntry.method);
    expect(message).toContain(logEntry.url);
    expect(message).toContain(logEntry.body.key);
    expect(message).toContain('key');
  });

  it('should return untouched object if it is not a ValidationError', () => {
    const info = {
      level: 'error',
      message: 'message',
      error: 'error text',
      body: {
        key: 'value',
      },
      method: 'POST',
      url: '/api/foo',
    };

    const res = validationErrorLogFormatter().transform(info);

    expect(res).toEqual(info);
  });
});
