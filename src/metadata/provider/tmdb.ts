import { z } from 'zod';
import { ConfigurationJson } from '../../entity/configurationModel.js';
import {
  JustWatchAvailability,
  JustWatchAvailabilityType,
} from '../../entity/justWatchModel.js';
import { getConfiguration } from '../../repository/configurationRepository.js';
import { formatISO } from 'date-fns';
import { dumpFetchResponse, withDefinedPropertyFactory } from '../../utils.js';
import _ from 'lodash';

export const TMDB_API_KEY = '779734046efc1e6127485c54d3b29627';

export const createTmdbFullImageUrl = (id?: string | null) => {
  if (!id) {
    return null;
  }

  return `https://image.tmdb.org/t/p/original${
    id.startsWith('/') ? '' : '/'
  }${id}`;
};

export const parseJustWatchResult = (
  configuration: ConfigurationJson,
  justWatch: z.infer<typeof tmdbJustWatchSchema>
) => {
  if (!configuration.justWatchCountryCode) {
    return;
  }

  const records = justWatch.results[configuration.justWatchCountryCode];

  if (!records) {
    return;
  }

  const mapRecords = (
    type: JustWatchAvailabilityType,
    records?: JustWatchRecord
  ): JustWatchAvailability[] => {
    if (!records) {
      return [];
    }

    return records.map((record) => ({
      displayPriority: record.display_priority,
      type: type,
      provider: {
        externalLogoUrl: createTmdbFullImageUrl(record.logo_path)!,
        id: record.provider_id,
        name: record.provider_name,
      },
      country: configuration.justWatchCountryCode || 'US',
    }));
  };

  return [
    ...mapRecords('flatrate', records.flatrate),
    ...mapRecords('buy', records.buy),
    ...mapRecords('rent', records.rent),
  ];
};

const justWatchRecordSchema = z
  .array(
    z.object({
      logo_path: z.string(),
      provider_id: z.number(),
      provider_name: z.string(),
      display_priority: z.number(),
    })
  )
  .optional()
  .nullable();

export const tmdbJustWatchSchema = z.object({
  results: z.record(
    z.object({
      link: z.string(),
      rent: justWatchRecordSchema,
      buy: justWatchRecordSchema,
      flatrate: justWatchRecordSchema,
    })
  ),
});

const tmdbChangesResponseSchema = z.object({
  results: z.array(
    z.object({ id: z.number().nullish(), adult: z.boolean().nullish() })
  ),
  page: z.number(),
  total_pages: z.number(),
  total_results: z.number(),
});

export const tmdbChanges = async (args: {
  startDate: Date;
  endDate: Date;
  category: 'tv' | 'movie';
}): Promise<number[]> => {
  const { startDate, endDate, category } = args;
  const configuration = await getConfiguration();

  let page = 1;
  const tmdbIdsToUpdate: number[] = [];

  while (true) {
    const res = await fetch(
      `https://api.themoviedb.org/3/${category}/changes?` +
        new URLSearchParams({
          api_key: TMDB_API_KEY,
          start_date: formatISO(startDate),
          end_date: formatISO(endDate),
          page: page.toString(),
          language: configuration.tmdbLang,
        })
    );

    if (res.status !== 200) {
      throw new Error(await dumpFetchResponse(res));
    }

    const data = tmdbChangesResponseSchema.parse(await res.json());

    tmdbIdsToUpdate.push(
      ...data.results
        .filter(withDefinedPropertyFactory('id'))
        .map((item) => item.id)
    );

    page++;

    if (page > data.total_pages) {
      break;
    }
  }

  return _.uniq(tmdbIdsToUpdate);
};

type JustWatchRecord = z.infer<typeof justWatchRecordSchema>;
