import { NextFunction, Request, Response } from 'express';
import { createHash } from 'crypto';
import { accessTokenRepository } from 'src/repository/accessToken';

export class AccessTokenMiddleware {
  static async authorize(req: Request, res: Response, next: NextFunction) {
    let token: string | undefined;

    // Check for token in Authorization header
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }

    // If not found in Authorization header, check Access-Token header
    if (!token) {
      token = req.header('Access-Token');
    }

    // If still not found, check query parameter
    if (!token && typeof req.query.token === 'string') {
      token = req.query.token;
    }

    if (!token) {
      next();
      return;
    }

    const hashedToken = createHash('sha256')
      .update(token, 'utf-8')
      .digest('hex');

    const accessToken = await accessTokenRepository.findOne({
      token: hashedToken,
    });

    if (!accessToken) {
      next();
      return;
    }

    req.user = accessToken.userId;

    next();
  }
}
