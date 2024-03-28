import _ from 'lodash';
import {
  JustWatchAvailability,
  JustWatchProviderResponse,
} from '../entity/justWatchModel.js';
import { Database } from '../database.js';
import { getImageId } from '../utils.js';

export const justWatchRepository = {
  async update(args: {
    mediaItemId: number;
    justWatchAvailability?: JustWatchAvailability[] | null;
  }) {
    const { mediaItemId, justWatchAvailability } = args;

    if (!justWatchAvailability) {
      return;
    }

    const justWatchProviders = _.uniqBy(
      justWatchAvailability.map((item) => item.provider),
      (item) => item.id
    );

    return await Database.knex.transaction(async (trx) => {
      const existingProviders = await trx('justWatchProvider').whereIn(
        'id',
        justWatchProviders.map((item) => item.id)
      );

      const newProviders = _.differenceBy(
        justWatchProviders,
        existingProviders,
        (item) => item.id
      ).map((item) => ({
        ...item,
        logo: getImageId(),
      }));

      const providerLogoById = _([...existingProviders, ...newProviders])
        .keyBy((item) => item.id)
        .mapValues((item) => item.logo)
        .value();

      await trx.batchInsert('justWatchProvider', newProviders);

      await trx('justWatchAvailability')
        .where('mediaItemId', mediaItemId)
        .delete();

      await trx.batchInsert(
        'justWatchAvailability',
        justWatchAvailability.map((item) => ({
          mediaItemId: mediaItemId,
          displayPriority: item.displayPriority,
          type: item.type,
          providerId: item.provider.id,
          country: item.country,
        }))
      );

      return _(justWatchAvailability)
        .sortBy((item) => item.displayPriority)
        .map((item) => ({
          type: item.type,
          providerName: item.provider.name,
          providerLogo: providerLogoById[item.provider.id],
        }))
        .groupBy((item) => item.type)
        .mapValues((item) => item.map((item) => _.omit(item, 'type')))
        .value();
    });
  },
  async getAll(): Promise<JustWatchProviderResponse[]> {
    const providers = await Database.knex('justWatchProvider');

    return _(providers)
      .map((item) => ({
        ...item,
        logo: `/api/v1/img/get?id=${item.logo}`,
      }))
      .sortBy((item) => item.name)
      .value();
  },
} as const;
