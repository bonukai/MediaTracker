import { i18n } from '@lingui/core';
import * as plurals from 'make-plural/plurals';
import { detect, fromNavigator } from '@lingui/detect-locale';

import { messages as da } from 'src/i18n/locales/da/translation';
import { messages as de } from 'src/i18n/locales/de/translation';
import { messages as en } from 'src/i18n/locales/en/translation';
import { messages as es } from 'src/i18n/locales/es/translation';

export const setupI18n = () => {
  const allMessages = {
    da: da,
    de: de,
    en: en,
    es: es,
  };

  const supportedLanguages = Object.keys(allMessages);

  const detectedLocale = detect(fromNavigator(), 'en').split('-')?.at(0);

  const locale = supportedLanguages.includes(detectedLocale)
    ? detectedLocale
    : 'en';

  i18n.loadLocaleData({
    [locale]: { plurals: plurals[locale] },
  });
  i18n.load(allMessages);
  i18n.activate(locale);
};
