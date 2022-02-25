import { createExpressRoute } from 'typescript-routes-to-openapi-server';
import { MediaItemDetailsResponse } from 'src/entity/mediaItem';
import { mediaItemRepository } from 'src/repository/mediaItem';
import { updateMediaItem } from 'src/updateMetadata';

/**
 * @openapi_tags MediaItem
 */
export class MediaItemController {
  /**
   * @openapi_operationId get
   */
  details = createExpressRoute<{
    method: 'get';
    path: '/api/details/:mediaItemId';
    pathParams: {
      mediaItemId: number;
    };
    responseBody: MediaItemDetailsResponse;
  }>(async (req, res) => {
    const userId = Number(req.user);
    const { mediaItemId } = req.params;

    const mediaItem = await mediaItemRepository.findOne({
      id: mediaItemId,
    });

    if (!mediaItem) {
      res.status(404).send();
      return;
    }

    if (mediaItem.needsDetails == true) {
      await updateMediaItem(mediaItem);
    }

    const details = await mediaItemRepository.details({
      mediaItemId: mediaItemId,
      userId: userId,
    });

    res.send(details);
  });

  /**
   * @openapi_operationId updateMetadata
   */
  updateMetadata = createExpressRoute<{
    method: 'get';
    path: '/api/details/update-metadata/:mediaItemId';
    pathParams: {
      mediaItemId: number;
    };
  }>(async (req, res) => {
    const { mediaItemId } = req.params;

    const mediaItem = await mediaItemRepository.findOne({
      id: mediaItemId,
    });

    if (!mediaItem) {
      res.status(404).send();
      return;
    }

    await updateMediaItem(mediaItem);

    res.sendStatus(200);
  });
}
