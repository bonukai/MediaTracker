import { i18n } from '@lingui/core';
import * as plurals from 'make-plural/plurals';
import { detect, fromNavigator } from '@lingui/detect-locale';

import { messages as messagesEm } from 'src/i18n/locales/en/translation';
import { messages as messagesDe } from 'src/i18n/locales/de/translation';

export const setupI18n = () => {
  const locale = detect(fromNavigator(), 'en').split('-')?.at(0) || 'en';

  i18n.loadLocaleData({
    [locale]: { plurals: plurals[locale] },
  });
  i18n.load({ en: messagesEm, de: messagesDe });
  i18n.activate(locale);
};
