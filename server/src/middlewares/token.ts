import { NextFunction, Request, Response } from 'express';
import { createHash } from 'crypto';
import { accessTokenRepository } from 'src/repository/accessToken';

export class AccessTokenMiddleware {
    static async authorize(req: Request, res: Response, next: NextFunction) {
        const token =
            req.header('Access-Token') ||
            (typeof req.query.token === 'string' && req.query.token);

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
