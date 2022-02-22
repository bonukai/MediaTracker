export const createLock = <Args extends unknown[], ReturnType>(
  f: (...args: Args) => Promise<ReturnType>
) => {
  let locked = false;

  return async (...args: Args) => {
    if (locked) {
      throw new LockError(`Function ${f.name ? f.name + ' ' : ''}is locked`);
    }

    locked = true;

    try {
      const res = await f(...args);
      locked = false;
      return res;
    } catch (error) {
      locked = false;
      throw error;
    }
  };
};

export class LockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
