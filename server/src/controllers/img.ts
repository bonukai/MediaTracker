import path from 'path';
import fs from 'fs-extra';

import { createExpressRoute } from 'typescript-routes-to-openapi-server';
import { downloadAsset } from 'src/utils';
import { mediaItemRepository } from 'src/repository/mediaItem';
import { tvSeasonRepository } from 'src/repository/season';
import { imageRepository } from 'src/repository/image';

type ImgSize = 'small' | 'original';

/**
 * @openapi_tags Img
 */
export class ImgController {
    /**
     * @openapi_operationId GetImage
     */
    image = createExpressRoute<{
        method: 'get';
        path: '/img/:id';
        requestQuery: {
            size?: ImgSize;
        };
        pathParams: {
            id: string;
        };
        /**
         * @contentType image/webp
         * @description Image
         */
        responseBody: string;
    }>(async (req, res) => {
        const { size } = req.query;
        const { id } = req.params;

        const imagePath = path.resolve('img', size || 'original', `${id}.webp`);

        if (!(await fs.pathExists(imagePath))) {
            const image = await imageRepository.findOne({ id: id });

            if (!image) {
                res.sendStatus(404);
                return;
            }

            if (image.seasonId) {
                const season = await tvSeasonRepository.findOne({
                    id: image.seasonId,
                });

                if (!season.poster) {
                    res.sendStatus(404);
                    return;
                }

                await downloadAsset({
                    imageId: image.id,
                    url: season.poster,
                });
            } else {
                const mediaItem = await mediaItemRepository.findOne({
                    id: image.mediaItemId,
                });

                const url =
                    image.type === 'poster'
                        ? mediaItem.poster
                        : mediaItem.backdrop;

                if (!url) {
                    res.sendStatus(404);
                    return;
                }

                await downloadAsset({
                    imageId: image.id,
                    url: url,
                });
            }
        }

        if (!(await fs.pathExists(imagePath))) {
            res.sendStatus(404);
            return;
        }

        res.setHeader('Content-Type', 'image/webp');
        res.set('Cache-Control', 'max-age=31536000');
        res.sendFile(imagePath);
    });
}
