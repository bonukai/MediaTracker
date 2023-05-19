import _ from 'lodash';
import { createExpressRoute } from 'typescript-routes-to-openapi-server';

import { MediaItemItemsResponse, MediaType } from 'src/entity/mediaItem';
import { metadataProviders } from 'src/metadata/metadataProviders';
import { mediaItemRepository } from 'src/repository/mediaItem';

/**
 * @openapi_tags Search
 */
export class SearchController {
  /**
   * @openapi_operationId search
   */
  search = createExpressRoute<{
    method: 'get';
    path: '/api/search';
    responseBody: MediaItemItemsResponse[];
    requestQuery: {
      q: string;
      mediaType: MediaType;
    };
  }>(async (req, res) => {
    const userId = Number(req.user);
    const { mediaType, q: query } = req.query;

    if (typeof query !== 'string' || query?.trim()?.length === 0) {
      res.sendStatus(400);
      return;
    }

    if (!metadataProviders.has(mediaType)) {
      throw new Error(`No metadata provider for "${mediaType}"`);
    }

    const metadataProvider = metadataProviders.get(mediaType);
    const searchResult = await metadataProvider.search(query);

    const result = await mediaItemRepository.mergeSearchResultWithExistingItems(
      searchResult,
      mediaType
    );

    const existingItemsDetails = await mediaItemRepository.items({
      userId: userId,
      mediaItemIds: result.map((item) => item.id),
    });

    res.send(existingItemsDetails);
  });
}
