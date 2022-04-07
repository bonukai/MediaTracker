import { NextFunction } from 'express';

export const request = (
  handler: (
    req: Express.Request,
    res: Express.Response,
    next: NextFunction
  ) => void,
  args: {
    userId: number;
    pathParams?: Record<string, unknown>;
    requestQuery?: Record<string, unknown>;
  }
) => {
  return new Promise<{
    statusCode: number;
    data?: unknown;
  }>((resolve, reject) => {
    handler(
      {
        user: args.userId,
        params: args.pathParams,
        query: args.requestQuery,
      } as unknown as Express.Request,
      {
        send: (data: unknown) =>
          resolve({
            statusCode: 200,
            data: data,
          }),
        sendStatus: (status: number) =>
          resolve({
            statusCode: status,
          }),
      },
      reject
    );
  });
};
