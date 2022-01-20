import _ from 'lodash';
import { createExpressRoute } from 'typescript-routes-to-openapi-server';

import {
    mediaItemBackdropPath,
    MediaItemForProvider,
    MediaItemItemsResponse,
    mediaItemPosterPath,
    MediaType,
} from 'src/entity/mediaItem';
import { metadataProviders } from 'src/metadata/metadataProviders';
import { mediaItemRepository } from 'src/repository/mediaItem';
import { getItemsKnex } from 'src/knex/queries/items';

const externalIdColumnNames = <const>[
    'openlibraryId',
    'imdbId',
    'tmdbId',
    'igdbId',
    'tvmazeId',
    'audibleId',
];

const mergeSearchResultWithExistingItems = (
    searchResult: MediaItemForProvider[],
    existingItems: MediaItemItemsResponse[]
) => {
    const idsMap = {
        imdbId: new Map<string | number, MediaItemItemsResponse>(),
        tvmazeId: new Map<string | number, MediaItemItemsResponse>(),
        tmdbId: new Map<string | number, MediaItemItemsResponse>(),
        igdbId: new Map<string | number, MediaItemItemsResponse>(),
        openlibraryId: new Map<string | number, MediaItemItemsResponse>(),
        audibleId: new Map<string | number, MediaItemItemsResponse>(),
    };

    existingItems?.forEach((mediaItem) => {
        for (const provider of externalIdColumnNames) {
            if (mediaItem[provider]) {
                idsMap[provider].set(mediaItem[provider], mediaItem);
            }
        }
    });

    return searchResult.map((item) => {
        for (const provider of externalIdColumnNames) {
            if (idsMap[provider].has(item[provider])) {
                return idsMap[provider].get(item[provider]);
            }
        }
        return item;
    });
};

const findExistingItems = async (searchResult: MediaItemForProvider[]) => {
    const externalIds = _(externalIdColumnNames)
        .keyBy((id) => id)
        .mapValues((id) =>
            searchResult.map((mediaItem) => mediaItem[id]).filter(Boolean)
        )
        .value();

    return await mediaItemRepository.findByExternalIds(externalIds);
};

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

        const existingItems = await findExistingItems(searchResult);

        const existingItemsDetails = await getItemsKnex({
            userId: userId,
            mediaItemIds: existingItems.map((mediaItem) => mediaItem.id),
        });

        const mergedItems = mergeSearchResultWithExistingItems(
            searchResult,
            existingItemsDetails
        );

        const result = await Promise.all(
            mergedItems.map(async (item) => {
                if ('id' in item) {
                    return item;
                } else {
                    const id = await mediaItemRepository.create(item);

                    return {
                        id: id,
                        lastTimeUpdated: new Date().getTime(),
                        ...item,
                        poster: item.poster
                            ? mediaItemPosterPath(id, 'small')
                            : null,
                        posterSmall: item.poster
                            ? mediaItemPosterPath(id, 'original')
                            : null,
                        backdrop: item.backdrop
                            ? mediaItemBackdropPath(id)
                            : null,
                    };
                }
            })
        );

        res.send(result);
    });
}
