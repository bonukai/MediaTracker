import path from 'path';
import fs from 'fs-extra';

import { createExpressRoute } from 'typescript-routes-to-openapi-server';
import { downloadAsset } from 'src/utils';
import { mediaItemRepository } from 'src/repository/mediaItem';
import { tvSeasonRepository } from 'src/repository/season';

type ImgSize = 'small' | 'original';

export const getImagePath = (args: {
    size: ImgSize;
    type: 'poster' | 'backdrop';
    mediaItemId?: number;
    seasonId?: number;
}) => {
    const { size, mediaItemId, seasonId, type } = args;

    return path.resolve(
        'img',
        type,
        seasonId ? 'season' : 'media_item',
        size,
        (seasonId ? seasonId.toString() : mediaItemId.toString()) + '.webp'
    );
};

/**
 * @openapi_tags Img
 */
export class ImgController {
    /**
     * @openapi_operationId GetPoster
     */
    poster = createExpressRoute<{
        method: 'get';
        path: '/img/poster';
        requestQuery: {
            mediaItemId?: number;
            seasonId?: number;
            size?: ImgSize;
        };
        /**
         * @contentType image/png
         * @description Image
         */
        responseBody: string;
    }>(async (req, res) => {
        const { mediaItemId, seasonId, size } = req.query;

        if (!mediaItemId && !seasonId) {
            res.sendStatus(404);
            return;
        }

        const imagePath = getImagePath({
            size: 'original',
            mediaItemId: mediaItemId,
            seasonId: seasonId,
            type: 'poster',
        });

        const imageSmallPath = getImagePath({
            size: 'small',
            mediaItemId: mediaItemId,
            seasonId: seasonId,
            type: 'poster',
        });

        res.setHeader('Content-Type', 'image/webp');
        res.set('Cache-Control', 'max-age=2592000');

        if (
            !(await fs.pathExists(imagePath)) ||
            !(await fs.pathExists(imageSmallPath))
        ) {
            if (mediaItemId) {
                const mediaItem = await mediaItemRepository.findOne({
                    id: mediaItemId,
                });

                if (!mediaItem) {
                    res.sendStatus(404);
                    return;
                }

                if (!mediaItem.poster) {
                    res.sendStatus(404);
                    return;
                }

                await downloadAsset({
                    assetsType: 'poster',
                    mediaItem: mediaItem,
                });
            } else if (seasonId) {
                const season = await tvSeasonRepository.findOne({
                    id: seasonId,
                });

                if (!season.poster) {
                    res.sendStatus(404);
                    return;
                }

                await downloadAsset({
                    assetsType: 'poster',
                    season: season,
                });
            }
        }

        if (size === 'small') {
            res.sendFile(imageSmallPath);
        } else {
            res.sendFile(imagePath);
        }
    });

    /**
     * @openapi_operationId GetBackdrop
     */
    backdrop = createExpressRoute<{
        method: 'get';
        path: '/img/backdrop';
        requestQuery: {
            mediaItemId: number;
            size?: ImgSize;
        };
        /**
         * @contentType image/png
         * @description Image
         */
        responseBody: string;
    }>(async (req, res) => {
        const { mediaItemId, size } = req.query;

        const imagePath = getImagePath({
            size: 'original',
            mediaItemId: mediaItemId,
            type: 'backdrop',
        });

        const imageSmallPath = getImagePath({
            size: 'small',
            mediaItemId: mediaItemId,
            type: 'backdrop',
        });

        if (
            !(await fs.pathExists(imagePath)) ||
            !(await fs.pathExists(imageSmallPath))
        ) {
            const mediaItem = await mediaItemRepository.findOne({
                id: mediaItemId,
            });

            if (!mediaItem) {
                res.sendStatus(404);
                return;
            }

            if (!mediaItem.poster) {
                res.sendStatus(404);
                return;
            }

            await downloadAsset({
                assetsType: 'backdrop',
                mediaItem: mediaItem,
            });
        }

        res.setHeader('Content-Type', 'image/webp');
        res.set('Cache-Control', 'max-age=2592000');

        if (size === 'small') {
            res.sendFile(imageSmallPath);
        } else {
            res.sendFile(imagePath);
        }
    });
}
