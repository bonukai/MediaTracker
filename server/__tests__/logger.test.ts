import { logWithId } from 'src/logger/formatters';

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
});
