import { z } from 'zod';

export const audibleCountryCodeSchema = z.enum([
  'au',
  'ca',
  'de',
  'es',
  'fr',
  'in',
  'it',
  'uk',
  'us',
  'jp',
]);

const tmdbLanguageSchema = z.enum([
  'af',
  'af-ZA',
  'ar',
  'ar-AE',
  'ar-BH',
  'ar-DZ',
  'ar-EG',
  'ar-IQ',
  'ar-JO',
  'ar-KW',
  'ar-LB',
  'ar-LY',
  'ar-MA',
  'ar-OM',
  'ar-QA',
  'ar-SA',
  'ar-SY',
  'ar-TN',
  'ar-YE',
  'az',
  'az-AZ',
  'be',
  'be-BY',
  'bg',
  'bg-BG',
  'bs-BA',
  'ca',
  'ca-ES',
  'cs',
  'cs-CZ',
  'cy',
  'cy-GB',
  'da',
  'da-DK',
  'de',
  'de-AT',
  'de-CH',
  'de-DE',
  'de-LI',
  'de-LU',
  'dv',
  'dv-MV',
  'el',
  'el-GR',
  'en',
  'en-AU',
  'en-BZ',
  'en-CA',
  'en-CB',
  'en-GB',
  'en-IE',
  'en-JM',
  'en-NZ',
  'en-PH',
  'en-TT',
  'en-US',
  'en-ZA',
  'en-ZW',
  'eo',
  'es',
  'es-AR',
  'es-BO',
  'es-CL',
  'es-CO',
  'es-CR',
  'es-DO',
  'es-EC',
  'es-ES',
  'es-GT',
  'es-HN',
  'es-MX',
  'es-NI',
  'es-PA',
  'es-PE',
  'es-PR',
  'es-PY',
  'es-SV',
  'es-UY',
  'es-VE',
  'et',
  'et-EE',
  'eu',
  'eu-ES',
  'fa',
  'fa-IR',
  'fi',
  'fi-FI',
  'fo',
  'fo-FO',
  'fr',
  'fr-BE',
  'fr-CA',
  'fr-CH',
  'fr-FR',
  'fr-LU',
  'fr-MC',
  'gl',
  'gl-ES',
  'gu',
  'gu-IN',
  'he',
  'he-IL',
  'hi',
  'hi-IN',
  'hr',
  'hr-BA',
  'hr-HR',
  'hu',
  'hu-HU',
  'hy',
  'hy-AM',
  'id',
  'id-ID',
  'is',
  'is-IS',
  'it',
  'it-CH',
  'it-IT',
  'ja',
  'ja-JP',
  'ka',
  'ka-GE',
  'kk',
  'kk-KZ',
  'kn',
  'kn-IN',
  'ko',
  'ko-KR',
  'kok',
  'kok-IN',
  'ky',
  'ky-KG',
  'lt',
  'lt-LT',
  'lv',
  'lv-LV',
  'mi',
  'mi-NZ',
  'mk',
  'mk-MK',
  'mn',
  'mn-MN',
  'mr',
  'mr-IN',
  'ms',
  'ms-BN',
  'ms-MY',
  'mt',
  'mt-MT',
  'nb',
  'nb-NO',
  'nl',
  'nl-BE',
  'nl-NL',
  'nn-NO',
  'ns',
  'ns-ZA',
  'pa',
  'pa-IN',
  'pl',
  'pl-PL',
  'ps',
  'ps-AR',
  'pt',
  'pt-BR',
  'pt-PT',
  'qu',
  'qu-BO',
  'qu-EC',
  'qu-PE',
  'ro',
  'ro-RO',
  'ru',
  'ru-RU',
  'sa',
  'sa-IN',
  'se',
  'se-FI',
  'se-NO',
  'se-SE',
  'sk',
  'sk-SK',
  'sl',
  'sl-SI',
  'sq',
  'sq-AL',
  'sr-BA',
  'sr-SP',
  'sv',
  'sv-FI',
  'sv-SE',
  'sw',
  'sw-KE',
  'syr',
  'syr-SY',
  'ta',
  'ta-IN',
  'te',
  'te-IN',
  'th',
  'th-TH',
  'tl',
  'tl-PH',
  'tn',
  'tn-ZA',
  'tr',
  'tr-TR',
  'tt',
  'tt-RU',
  'ts',
  'uk',
  'uk-UA',
  'ur',
  'ur-PK',
  'uz',
  'uz-UZ',
  'vi',
  'vi-VN',
  'xh',
  'xh-ZA',
  'zh',
  'zh-CN',
  'zh-HK',
  'zh-MO',
  'zh-SG',
  'zh-TW',
  'zu',
  'zu-ZA',
]);

export const ISO_3166_1_schema = z.enum([
  'AF',
  'AX',
  'AL',
  'DZ',
  'AS',
  'AD',
  'AO',
  'AI',
  'AQ',
  'AG',
  'AR',
  'AM',
  'AW',
  'AU',
  'AT',
  'AZ',
  'BS',
  'BH',
  'BD',
  'BB',
  'BY',
  'BE',
  'BZ',
  'BJ',
  'BM',
  'BT',
  'BO',
  'BQ',
  'BA',
  'BW',
  'BV',
  'BR',
  'IO',
  'BN',
  'BG',
  'BF',
  'BI',
  'KH',
  'CM',
  'CA',
  'CV',
  'KY',
  'CF',
  'TD',
  'CL',
  'CN',
  'CX',
  'CC',
  'CO',
  'KM',
  'CG',
  'CD',
  'CK',
  'CR',
  'CI',
  'HR',
  'CU',
  'CW',
  'CY',
  'CZ',
  'DK',
  'DJ',
  'DM',
  'DO',
  'EC',
  'EG',
  'SV',
  'GQ',
  'ER',
  'EE',
  'ET',
  'FK',
  'FO',
  'FJ',
  'FI',
  'FR',
  'GF',
  'PF',
  'TF',
  'GA',
  'GM',
  'GE',
  'DE',
  'GH',
  'GI',
  'GR',
  'GL',
  'GD',
  'GP',
  'GU',
  'GT',
  'GG',
  'GN',
  'GW',
  'GY',
  'HT',
  'HM',
  'VA',
  'HN',
  'HK',
  'HU',
  'IS',
  'IN',
  'ID',
  'IR',
  'IQ',
  'IE',
  'IM',
  'IL',
  'IT',
  'JM',
  'JP',
  'JE',
  'JO',
  'KZ',
  'KE',
  'KI',
  'KP',
  'KR',
  'KW',
  'KG',
  'LA',
  'LV',
  'LB',
  'LS',
  'LR',
  'LY',
  'LI',
  'LT',
  'LU',
  'MO',
  'MK',
  'MG',
  'MW',
  'MY',
  'MV',
  'ML',
  'MT',
  'MH',
  'MQ',
  'MR',
  'MU',
  'YT',
  'MX',
  'FM',
  'MD',
  'MC',
  'MN',
  'ME',
  'MS',
  'MA',
  'MZ',
  'MM',
  'NA',
  'NR',
  'NP',
  'NL',
  'NC',
  'NZ',
  'NI',
  'NE',
  'NG',
  'NU',
  'NF',
  'MP',
  'NO',
  'OM',
  'PK',
  'PW',
  'PS',
  'PA',
  'PG',
  'PY',
  'PE',
  'PH',
  'PN',
  'PL',
  'PT',
  'PR',
  'QA',
  'RE',
  'RO',
  'RU',
  'RW',
  'BL',
  'SH',
  'KN',
  'LC',
  'MF',
  'PM',
  'VC',
  'WS',
  'SM',
  'ST',
  'SA',
  'SN',
  'RS',
  'SC',
  'SL',
  'SG',
  'SX',
  'SK',
  'SI',
  'SB',
  'SO',
  'ZA',
  'GS',
  'SS',
  'ES',
  'LK',
  'SD',
  'SR',
  'SJ',
  'SZ',
  'SE',
  'CH',
  'SY',
  'TW',
  'TJ',
  'TZ',
  'TH',
  'TL',
  'TG',
  'TK',
  'TO',
  'TT',
  'TN',
  'TR',
  'TM',
  'TC',
  'TV',
  'UG',
  'UA',
  'AE',
  'GB',
  'US',
  'UM',
  'UY',
  'UZ',
  'VU',
  'VE',
  'VN',
  'VG',
  'VI',
  'WF',
  'EH',
  'YE',
  'ZM',
  'ZW',
]);

export const tvMetadataProvider = z.enum(['TMDb', 'tvmaze']);

export const configurationModelSchema = z.object({
  configurationJson: z.string().nullish(),
});

export const configurationJsonSchema = z.object({
  enableRegistration: z.coerce.boolean(),
  tmdbLang: tmdbLanguageSchema,
  audibleLang: audibleCountryCodeSchema,
  igdbClientId: z.string().nullish(),
  igdbClientSecret: z.string().nullish(),
  publicAddress: z
    .string()
    .url()
    .refine(
      (url) => {
        if (new URL(url).origin === 'null') {
          return false;
        }

        return true;
      },
      {
        message: 'invalid URL',
      }
    )
    .nullish(),
  justWatchCountryCode: ISO_3166_1_schema.nullish(),
  theatricalReleaseCountryCode: ISO_3166_1_schema.nullish(),
  digitalReleaseCountryCode: ISO_3166_1_schema.nullish(),
  physicalReleaseCountryCode: ISO_3166_1_schema.nullish(),
  tvReleaseCountryCode: ISO_3166_1_schema.nullish(),
  useTvMazeForEpisodeReleaseDates: z.boolean().default(false),
  // metadataUpdatePolicy: z.record(
  //   mediaTypeSchema,
  //   z.object({
  //     frequencyForReleasedItems: z.number().nullable(),
  //     frequencyForUnreleasedItems: z.number().nullable(),
  //   })
  // ),
});

export type AudibleCountryCode = z.infer<typeof audibleCountryCodeSchema>;
export type TmdbLanguageCode = z.infer<typeof tmdbLanguageSchema>;
export type TvMetadataProvider = z.infer<typeof tvMetadataProvider>;
export type ConfigurationModel = z.infer<typeof configurationModelSchema>;
export type ConfigurationJson = z.infer<typeof configurationJsonSchema>;
export type ISO_3166_1 = z.infer<typeof ISO_3166_1_schema>;

export const defaultConfiguration: ConfigurationJson = {
  enableRegistration: true,
  tmdbLang: 'en',
  audibleLang: 'us',
  justWatchCountryCode: 'US',
  useTvMazeForEpisodeReleaseDates: false,
  // metadataUpdatePolicy: {
  //   audiobook: {
  //     frequencyForReleasedItems: null,
  //     frequencyForUnreleasedItems: 30,
  //   },
  //   book: {
  //     frequencyForReleasedItems: null,
  //     frequencyForUnreleasedItems: 30,
  //   },
  //   video_game: {
  //     frequencyForReleasedItems: null,
  //     frequencyForUnreleasedItems: 30,
  //   },
  // },
};
