import { customRandom, urlAlphabet, random } from 'nanoid';
import { createHash } from 'crypto';

import { accessTokenRepository } from 'src/repository/accessToken';
import { createExpressRoute } from 'typescript-routes-to-openapi-server';

const nanoidToken = customRandom(urlAlphabet, 30, random);

/**
 * @openapi_tags Token
 */
export class TokenController {
    /**
     * @description Add token
     * @openapi_operationId add
     */
    add = createExpressRoute<{
        method: 'put';
        path: '/api/tokens';
        requestQuery: {
            description: string;
        };
        responseBody: {
            token: string;
        };
    }>(async (req, res) => {
        const userId = Number(req.user);
        const { description } = req.query;

        const result = await accessTokenRepository.findOne({
            userId: userId,
            description: description,
        });

        if (result) {
            res.sendStatus(400);
            return;
        }

        const token = nanoidToken();

        const tokenHash = createHash('sha256')
            .update(token, 'utf-8')
            .digest('hex');

        await accessTokenRepository.create({
            description: description,
            token: tokenHash,
            userId: userId,
        });

        res.send({ token: token });
    });

    /**
     * @description Delete token
     * @openapi_operationId delete
     */
    delete = createExpressRoute<{
        method: 'delete';
        path: '/api/tokens';
        requestQuery: {
            description: string;
        };
    }>(async (req, res) => {
        const userId = Number(req.user);
        const { description } = req.query;

        await accessTokenRepository.delete({
            description: description,
            userId: userId,
        });

        res.send();
    });

    /**
     * @description Get all tokens
     * @openapi_operationId get
     */
    get = createExpressRoute<{
        method: 'get';
        path: '/api/tokens';
        /**
         * @description List of token descriptions
         */
        responseBody: string[];
    }>(async (req, res) => {
        const userId = Number(req.user);

        const tokens = await accessTokenRepository.find({
            userId: userId,
        });
        res.send(tokens.map((token) => token.description));
    });
}
