import { i18n, setupI18n } from '@lingui/core';

import { messages as da } from './i18n/locales/da/translation.js';
import { messages as de } from './i18n/locales/de/translation.js';
import { messages as en } from './i18n/locales/en/translation.js';
import { messages as es } from './i18n/locales/es/translation.js';
import { messages as fr } from './i18n/locales/fr/translation.js';
import { messages as ko } from './i18n/locales/ko/translation.js';
import { messages as pt } from './i18n/locales/pt/translation.js';

export const setupI18n2 = () => {
  const messages = {
    da,
    de,
    en,
    es,
    fr,
    ko,
    pt,
  };

  const supportedLanguages = Object.keys(messages);
  const detectedLocale = detectLocale();
  const locale =
    detectedLocale && supportedLanguages.includes(detectedLocale)
      ? detectedLocale
      : 'en';

  i18n.load(messages);
  i18n.activate(locale);

  setupI18n({
    locale,
    locales: supportedLanguages,
    messages: messages,
  });
};

export const detectLocale = () => {
  return navigator.language.split('-')?.at(0);
};
