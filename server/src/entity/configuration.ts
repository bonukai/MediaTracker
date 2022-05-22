export type Configuration = {
  id?: number;
  enableRegistration: boolean;
  tmdbLang?: TmdbLang;
  audibleLang?: AudibleLang;
  serverLang?: ServerLang;
  igdbClientId?: string;
  igdbClientSecret?: string;
};

export type ServerLang = 'da' | 'de' | 'en' | 'es' | 'pt';

export type AudibleLang =
  | 'au'
  | 'ca'
  | 'de'
  | 'es'
  | 'fr'
  | 'in'
  | 'it'
  | 'uk'
  | 'us'
  | 'jp';

export type TmdbLang =
  | 'om'
  | 'ab'
  | 'aa'
  | 'af'
  | 'sq'
  | 'am'
  | 'ar'
  | 'hy'
  | 'as'
  | 'ay'
  | 'az'
  | 'ba'
  | 'eu'
  | 'bn'
  | 'dz'
  | 'bh'
  | 'bi'
  | 'br'
  | 'bg'
  | 'my'
  | 'be'
  | 'km'
  | 'ca'
  | 'zh'
  | 'co'
  | 'hr'
  | 'cs'
  | 'da'
  | 'nl'
  | 'en'
  | 'eo'
  | 'et'
  | 'fo'
  | 'fj'
  | 'fi'
  | 'fr'
  | 'fy'
  | 'gl'
  | 'ka'
  | 'de'
  | 'el'
  | 'kl'
  | 'gn'
  | 'gu'
  | 'ha'
  | 'he'
  | 'hi'
  | 'hu'
  | 'is'
  | 'id'
  | 'ia'
  | 'ie'
  | 'ik'
  | 'iu'
  | 'ga'
  | 'it'
  | 'ja'
  | 'jw'
  | 'kn'
  | 'ks'
  | 'kk'
  | 'rw'
  | 'ky'
  | 'rn'
  | 'ko'
  | 'ku'
  | 'lo'
  | 'la'
  | 'lv'
  | 'ln'
  | 'lt'
  | 'mk'
  | 'mg'
  | 'ms'
  | 'ml'
  | 'mt'
  | 'mi'
  | 'mr'
  | 'mo'
  | 'mn'
  | 'na'
  | 'ne'
  | 'no'
  | 'oc'
  | 'or'
  | 'ps'
  | 'fa'
  | 'pl'
  | 'pt'
  | 'pa'
  | 'qu'
  | 'rm'
  | 'ro'
  | 'ru'
  | 'sm'
  | 'sg'
  | 'sa'
  | 'gd'
  | 'sr'
  | 'sh'
  | 'st'
  | 'tn'
  | 'sn'
  | 'sd'
  | 'si'
  | 'ss'
  | 'sk'
  | 'sl'
  | 'so'
  | 'es'
  | 'su'
  | 'sw'
  | 'sv'
  | 'tl'
  | 'tg'
  | 'ta'
  | 'tt'
  | 'te'
  | 'th'
  | 'bo'
  | 'ti'
  | 'to'
  | 'ts'
  | 'tr'
  | 'tk'
  | 'tw'
  | 'ug'
  | 'uk'
  | 'ur'
  | 'uz'
  | 'vi'
  | 'vo'
  | 'cy'
  | 'wo'
  | 'xh'
  | 'yi'
  | 'yo'
  | 'za'
  | 'zu';

export const serverLang = ['da', 'de', 'en', 'es', 'pt'];
export const audibleLang = [
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
];
export const tmdbLang = [
  'om',
  'ab',
  'aa',
  'af',
  'sq',
  'am',
  'ar',
  'hy',
  'as',
  'ay',
  'az',
  'ba',
  'eu',
  'bn',
  'dz',
  'bh',
  'bi',
  'br',
  'bg',
  'my',
  'be',
  'km',
  'ca',
  'zh',
  'co',
  'hr',
  'cs',
  'da',
  'nl',
  'en',
  'eo',
  'et',
  'fo',
  'fj',
  'fi',
  'fr',
  'fy',
  'gl',
  'ka',
  'de',
  'el',
  'kl',
  'gn',
  'gu',
  'ha',
  'he',
  'hi',
  'hu',
  'is',
  'id',
  'ia',
  'ie',
  'ik',
  'iu',
  'ga',
  'it',
  'ja',
  'jw',
  'kn',
  'ks',
  'kk',
  'rw',
  'ky',
  'rn',
  'ko',
  'ku',
  'lo',
  'la',
  'lv',
  'ln',
  'lt',
  'mk',
  'mg',
  'ms',
  'ml',
  'mt',
  'mi',
  'mr',
  'mo',
  'mn',
  'na',
  'ne',
  'no',
  'oc',
  'or',
  'ps',
  'fa',
  'pl',
  'pt',
  'pa',
  'qu',
  'rm',
  'ro',
  'ru',
  'sm',
  'sg',
  'sa',
  'gd',
  'sr',
  'sh',
  'st',
  'tn',
  'sn',
  'sd',
  'si',
  'ss',
  'sk',
  'sl',
  'so',
  'es',
  'su',
  'sw',
  'sv',
  'tl',
  'tg',
  'ta',
  'tt',
  'te',
  'th',
  'bo',
  'ti',
  'to',
  'ts',
  'tr',
  'tk',
  'tw',
  'ug',
  'uk',
  'ur',
  'uz',
  'vi',
  'vo',
  'cy',
  'wo',
  'xh',
  'yi',
  'yo',
  'za',
  'zu',
];
