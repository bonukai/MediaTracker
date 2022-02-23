import { RequestHandler } from 'express';
import { logger } from 'src/logger';

export const httpLogMiddleware: RequestHandler = (req, res, next) => {
  res.once('finish', () =>
    logger.http(
      `${req.ip} "${req.method} ${req.path} HTTP/${req.httpVersion}" ${
        res.statusCode
      } ${res.getHeader('content-length')}`
    )
  );
  next();
};
