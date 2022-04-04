import { NextFunction } from 'express';

export const request = (
  handler: (
    req: Express.Request,
    res: Express.Response,
    next: NextFunction
  ) => void,
  args: {
    userId: number;
    pathParams: Record<string, unknown>;
  }
) => {
  return new Promise((resolve, reject) => {
    handler(
      {
        user: args.userId,
        query: args.pathParams,
      } as unknown as Express.Request,
      {
        send: (data: unknown) =>
          resolve({
            status: 200,
            data: data,
          }),
        sendStatus: (status: number) =>
          resolve({
            status: status,
          }),
      },
      reject
    );
  });
};
