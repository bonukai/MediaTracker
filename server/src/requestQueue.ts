export class RequestQueue {
  private readonly timeBetweenRequests: number;

  private queueLength = 0;
  private totalTimeToWait = 0;
  private lastRequestTime = 0;

  constructor(args: { timeBetweenRequests: number }) {
    this.timeBetweenRequests = args.timeBetweenRequests;
  }

  public async request<T>(request: () => Promise<T>): Promise<T> {
    this.queueLength += 1;
    const placeInQueue = this.queueLength;

    const addedTimeToWait =
      placeInQueue === 1
        ? Math.max(
            0,
            this.timeBetweenRequests -
              (new Date().getTime() - this.lastRequestTime)
          )
        : this.timeBetweenRequests;

    this.totalTimeToWait += addedTimeToWait;
    const timeToWait = this.totalTimeToWait;

    if (timeToWait > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, timeToWait));
    }

    this.lastRequestTime = new Date().getTime();

    const result = await request();

    this.queueLength -= 1;
    this.totalTimeToWait -= addedTimeToWait;

    return result;
  }
}
