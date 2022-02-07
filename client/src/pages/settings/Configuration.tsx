import React, { FunctionComponent } from 'react';
import { t } from '@lingui/macro';
import { useConfiguration } from 'src/api/configuration';
import { CheckboxWithTitleAndDescription } from 'src/components/Checkbox';
import { SettingsSegment } from 'src/components/SettingsSegment';

export const SettingsConfigurationPage: FunctionComponent = () => {
  const { configuration, update, isLoading } = useConfiguration();

  return (
    <>
      {isLoading ? (
        <></>
      ) : (
        <>
          <SettingsSegment title={t`General`}>
            <CheckboxWithTitleAndDescription
              title={t`Enable registration`}
              checked={configuration.enableRegistration}
              onChange={(value) => update({ enableRegistration: value })}
            />
          </SettingsSegment>

          <div className="mt-3" />

          <SettingsSegment title={t`Server language`}>
            <select
              value={configuration.serverLang || 'en'}
              onChange={(e) => update({ serverLang: e.currentTarget.value })}
            >
              <option value="en">English</option>
              <option value="de">German</option>
            </select>
          </SettingsSegment>

          <div className="mt-3" />

          <SettingsSegment title={t`Audible language`}>
            <select
              value={configuration.audibleLang || 'US'}
              onChange={(e) => update({ audibleLang: e.currentTarget.value })}
            >
              <option value="AU">Australia (English)</option>
              <option value="CA">Canada (English)</option>
              <option value="DE">Deutschland (Deutsch)</option>
              <option value="ES">España (Castellano)</option>
              <option value="FR">France (Français)</option>
              <option value="IN">India (English)</option>
              <option value="IT">Italia (Italiano)</option>
              <option value="UK">UK (English)</option>
              <option value="US">United States (English)</option>
              <option value="JP">日本 (日本語)</option>
            </select>
          </SettingsSegment>

          <div className="mt-3" />

          <SettingsSegment title={t`TMDB language`}>
            <select
              value={configuration.tmdbLang || 'en'}
              onChange={(e) => update({ tmdbLang: e.currentTarget.value })}
            >
              {Object.entries(languagesCodes).map(([code, language]) => (
                <option key={code} value={code}>{language}</option>
              ))}
            </select>
          </SettingsSegment>
        </>
      )}
    </>
  );
};

const languagesCodes = {
  om: '(Afan) Oromo',
  ab: 'Abkhazian',
  aa: 'Afar',
  af: 'Afrikaans',
  sq: 'Albanian',
  am: 'Amharic',
  ar: 'Arabic',
  hy: 'Armenian',
  as: 'Assamese',
  ay: 'Aymara',
  az: 'Azerbaijani',
  ba: 'Bashkir',
  eu: 'Basque',
  bn: 'Bengali',
  dz: 'Bhutani',
  bh: 'Bihari',
  bi: 'Bislama',
  br: 'Breton',
  bg: 'Bulgarian',
  my: 'Burmese',
  be: 'Byelorussian',
  km: 'Cambodian',
  ca: 'Catalan',
  zh: 'Chinese',
  co: 'Corsican',
  hr: 'Croatian',
  cs: 'Czech',
  da: 'Danish',
  nl: 'Dutch',
  en: 'English',
  eo: 'Esperanto',
  et: 'Estonian',
  fo: 'Faeroese',
  fj: 'Fiji',
  fi: 'Finnish',
  fr: 'French',
  fy: 'Frisian',
  gl: 'Galician',
  ka: 'Georgian',
  de: 'German',
  el: 'Greek',
  kl: 'Greenlandic',
  gn: 'Guarani',
  gu: 'Gujarati',
  ha: 'Hausa',
  he: 'Hebrew (former iw)',
  hi: 'Hindi',
  hu: 'Hungarian',
  is: 'Icelandic',
  id: 'Indonesian (former in)',
  ia: 'Interlingua',
  ie: 'Interlingue',
  ik: 'Inupiak',
  iu: 'Inuktitut (Eskimo)',
  ga: 'Irish',
  it: 'Italian',
  ja: 'Japanese',
  jw: 'Javanese',
  kn: 'Kannada',
  ks: 'Kashmiri',
  kk: 'Kazakh',
  rw: 'Kinyarwanda',
  ky: 'Kirghiz',
  rn: 'Kirundi',
  ko: 'Korean',
  ku: 'Kurdish',
  lo: 'Laothian',
  la: 'Latin',
  lv: 'Latvian, Lettish',
  ln: 'Lingala',
  lt: 'Lithuanian',
  mk: 'Macedonian',
  mg: 'Malagasy',
  ms: 'Malay',
  ml: 'Malayalam',
  mt: 'Maltese',
  mi: 'Maori',
  mr: 'Marathi',
  mo: 'Moldavian',
  mn: 'Mongolian',
  na: 'Nauru',
  ne: 'Nepali',
  no: 'Norwegian',
  oc: 'Occitan',
  or: 'Oriya',
  ps: 'Pashto, Pushto',
  fa: 'Persian',
  pl: 'Polish',
  pt: 'Portuguese',
  pa: 'Punjabi',
  qu: 'Quechua',
  rm: 'Rhaeto-Romance',
  ro: 'Romanian',
  ru: 'Russian',
  sm: 'Samoan',
  sg: 'Sangro',
  sa: 'Sanskrit',
  gd: 'Scots Gaelic',
  sr: 'Serbian',
  sh: 'Serbo-Croatian',
  st: 'Sesotho',
  tn: 'Setswana',
  sn: 'Shona',
  sd: 'Sindhi',
  si: 'Singhalese',
  ss: 'Siswati',
  sk: 'Slovak',
  sl: 'Slovenian',
  so: 'Somali',
  es: 'Spanish',
  su: 'Sudanese',
  sw: 'Swahili',
  sv: 'Swedish',
  tl: 'Tagalog',
  tg: 'Tajik',
  ta: 'Tamil',
  tt: 'Tatar',
  te: 'Tegulu',
  th: 'Thai',
  bo: 'Tibetan',
  ti: 'Tigrinya',
  to: 'Tonga',
  ts: 'Tsonga',
  tr: 'Turkish',
  tk: 'Turkmen',
  tw: 'Twi',
  ug: 'Uigur',
  uk: 'Ukrainian',
  ur: 'Urdu',
  uz: 'Uzbek',
  vi: 'Vietnamese',
  vo: 'Volapuk',
  cy: 'Welch',
  wo: 'Wolof',
  xh: 'Xhosa',
  yi: 'Yiddish (former ji)',
  yo: 'Yoruba',
  za: 'Zhuang',
  zu: 'Zulu',
};
