import { z } from 'zod';

import {
  AudibleCountryCode,
  audibleCountryCodeSchema,
} from '../../entity/configurationModel.js';
import { MediaItemMetadata } from '../../entity/mediaItemModel.js';
import { getConfiguration } from '../../repository/configurationRepository.js';
import { metadataProviderFactory } from '../metadataProvider.js';
import { dumpFetchResponse, tryParseISODate } from '../../utils.js';

const languages: Record<AudibleCountryCode, string> = {
  au: 'au',
  ca: 'ca',
  de: 'de',
  fr: 'fr',
  in: 'in',
  it: 'it',
  es: 'es',
  jp: 'co.jp',
  uk: 'co.uk',
  us: 'com',
};

const queryParams = {
  response_groups: ['contributors', 'rating', 'media', 'product_attrs'].join(
    ','
  ),
  image_sizes: [500, 1000, 2400].join(','),
};

export const Audible = metadataProviderFactory({
  name: 'audible',
  mediaType: 'audiobook',

  async search(args) {
    if (!args.query && !args.author && !args.narrator) {
      throw new Error(
        `at least one of fields: query, author or narrator is required`
      );
    }

    const countryCode = (await getConfiguration()).audibleLang;

    const res = await fetch(
      `https://api.audible.${languages[countryCode]}/1.0/catalog/products?` +
        new URLSearchParams({
          num_results: '50',
          ...queryParams,
          ...(args.query ? { title: args.query } : {}),
          ...(args.author ? { author: args.author } : {}),
          ...(args.narrator ? { narrator: args.narrator } : {}),
        })
    );

    if (res.status !== 200) {
      throw new Error(await dumpFetchResponse(res));
    }

    const data = searchResultSchema.parse(await res.json());

    return data.products.map((item) => mapItemResponse(item, countryCode));
  },
  async details(mediaItem) {
    if (typeof mediaItem.audibleId !== 'string') {
      throw new Error(
        `unable to retrieve details from Audible without audibleId`
      );
    }

    const { audibleId } = mediaItem;

    const countryCode = audibleCountryCodeSchema.parse(
      mediaItem.audibleCountryCode || (await getConfiguration()).audibleLang
    );

    const res = await fetch(
      `https://api.audible.${languages[countryCode]}/1.0/catalog/products/${audibleId}?` +
        new URLSearchParams(queryParams)
    );

    if (res.status === 404) {
      throw new Error(
        `audiobook with audibleId ${audibleId} in ${countryCode} does not exists`
      );
    }

    if (res.status !== 200) {
      throw new Error(await dumpFetchResponse(res));
    }

    const data = detailsResultSchema.parse(await res.json());

    if (!data.product.title) {
      throw new Error(`no details on audible for ${audibleId}`);
    }

    return mapItemResponse(data.product, countryCode);
  },
  async findByAudibleId(audibleId: string): Promise<MediaItemMetadata> {
    return await this.details({
      audibleId: audibleId,
      audibleCountryCode: (await getConfiguration()).audibleLang,
    });
  },
});

const mapItemResponse = (
  item: z.infer<typeof productSchema>,
  countryCode: AudibleCountryCode
): MediaItemMetadata => {
  return {
    needsDetails: false,
    mediaType: Audible.mediaType,
    source: Audible.name,
    audibleCountryCode: countryCode,
    title: item.title,
    audibleId: item.asin,
    authors: item.authors?.map((author) => author.name),
    narrators: item.narrators?.map((narrator) => narrator.name),
    externalPosterUrl: item.product_images?.[2400],
    language: item.language,
    releaseDate: tryParseISODate(item.release_date)?.toISOString(),
    runtime: (item.runtime_length_min || 0) * 60 * 1000 || null,
    overview: item.merchandising_summary,
  };
};

const productSchema = z.object({
  asin: z.string(),
  authors: z
    .array(
      z.object({
        name: z.string(),
      })
    )
    .nullish(),
  content_delivery_type: z.string().nullish(),
  format_type: z.string().nullish(),
  is_adult_product: z.boolean().nullish(),
  issue_date: z.string().nullish(),
  language: z.string().nullish(),
  merchandising_summary: z.string().nullish(),
  narrators: z
    .array(
      z.object({
        name: z.string(),
      })
    )
    .nullish(),
  product_images: z
    .object({
      '500': z.string().nullish(),
      '1000': z.string().nullish(),
      '2400': z.string().nullish(),
    })
    .nullish(),
  publication_name: z.string().nullish(),
  publisher_name: z.string().nullish(),
  release_date: z.string().nullish(),
  runtime_length_min: z.number().nullish(),
  series: z
    .array(
      z.object({
        asin: z.string(),
        sequence: z.string().nullish(),
        title: z.string(),
        url: z.string().nullish(),
      })
    )
    .nullish(),
  sku: z.string().nullish(),
  sku_lite: z.string().nullish(),
  title: z.string(),
  subtitle: z.string().nullish(),
  voice_description: z.string().nullish(),
});

const searchResultSchema = z.object({
  products: z.array(productSchema),
  response_groups: z.array(z.string()),
  total_results: z.number(),
});

const detailsResultSchema = z.object({
  product: productSchema,
  response_groups: z.array(z.string()),
});
