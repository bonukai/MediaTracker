import { logger } from 'src/logger';
import { catchAndLogError } from 'src/utils';

describe('catchAndLogError', () => {
  test('should catch exception', async () => {
    const errorLoggerSpy = jest
      .spyOn(logger, 'error')
      .mockImplementation(jest.fn());

    catchAndLogError(() => {
      throw new Error('Error 01234');
    });

    await catchAndLogError(() => {
      throw new Error('Error 56789');
    });

    expect(errorLoggerSpy).toBeCalledTimes(2);
  });
});
