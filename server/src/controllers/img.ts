import path from 'path';
import fs from 'fs-extra';

import { createExpressRoute } from 'typescript-routes-to-openapi-server';
import { downloadAsset } from 'src/utils';
import { Config } from 'src/config';
import { Database } from 'src/dbconfig';

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

    const imagePath = path.resolve(
      Config.ASSETS_PATH,
      size || 'original',
      `${id}.webp`
    );

    if (!(await fs.pathExists(imagePath))) {
      const imageUrl = await findImageUrlFromInternalId(id);

      if (!imageUrl) {
        res.sendStatus(404);
        return;
      }

      await downloadAsset({
        imageId: id,
        url: imageUrl,
      });
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

export const findImageUrlFromInternalId = async (imageId: string) => {
  const mediaItemWithPoster = await Database.knex('mediaItem')
    .where('posterId', imageId)
    .first();

  if (mediaItemWithPoster) {
    return mediaItemWithPoster.externalPosterUrl;
  }

  const mediaItemWithBackdrop = await Database.knex('mediaItem')
    .where('backdropId', imageId)
    .first();

  if (mediaItemWithBackdrop) {
    return mediaItemWithBackdrop.externalBackdropUrl;
  }

  const seasonWithPoster = await Database.knex('season')
    .where('posterId', imageId)
    .first();

  if (seasonWithPoster) {
    return seasonWithPoster.externalPosterUrl;
  }
};
