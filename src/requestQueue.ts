import { differenceInMilliseconds } from 'date-fns';

export const requestQueueFactory = (args: { timeBetweenRequests: number }) => {
  const { timeBetweenRequests } = args;

  const waitingQueue: {
    promise: Promise<void>;
    resolve: () => void;
  }[] = [];

  let lastTimeRequest = new Date(0);

  const queue = async <T>(fn: () => Promise<T> | T) => {
    if (waitingQueue.length > 0) {
      waitingQueue.push(deferred());
      await waitingQueue.at(-2)?.promise;
    }

    const timeDifferenceBetweenRequests = differenceInMilliseconds(
      Date.now(),
      lastTimeRequest
    );

    if (timeDifferenceBetweenRequests < timeBetweenRequests) {
      waitingQueue.push(deferred());
      await sleep(timeBetweenRequests - timeDifferenceBetweenRequests);
    }

    lastTimeRequest = new Date();

    waitingQueue.shift()?.resolve();

    return await fn();
  };

  return queue;
};

const sleep = (duration: number) => {
  return new Promise<void>((resolve) => setTimeout(resolve, duration));
};

const deferred = () => {
  let resolve!: () => void;

  const promise = new Promise<void>((a, b) => {
    resolve = a;
  });

  return { promise, resolve };
};
