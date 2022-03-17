import { createLock, LockError } from 'src/lock';

const fn = async <T>(args?: {
  setResolve?: (resolve: () => void) => void;
  returnValue?: T;
}) => {
  const { setResolve, returnValue } = args || {};

  if (setResolve) {
    return new Promise<void>((resolve) => setResolve(resolve));
  }

  return returnValue;
};

const fnWithLock = createLock(fn);
let resolve: () => void;
let promise: Promise<unknown>;

describe('lock', () => {
  it('should complete first call', async () => {
    expect(
      await fnWithLock({
        returnValue: 123,
      })
    ).toEqual(123);
  });

  it('should throw LockError when in use', async () => {
    fnWithLock({
      setResolve: (value) => (resolve = value),
    });

    promise = fnWithLock();
    await expect(promise).rejects.toThrow(LockError);
  });

  it('should complete after resolving previous call', async () => {
    resolve();
    await new Promise<void>((resolve) => promise.catch(() => resolve()));
    expect(
      await fnWithLock({
        returnValue: 456,
      })
    ).toEqual(456);
  });

  it('should complete next call', async () => {
    expect(
      await fnWithLock({
        returnValue: 789,
      })
    ).toEqual(789);
  });
});
