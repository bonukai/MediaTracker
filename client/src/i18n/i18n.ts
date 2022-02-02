import { i18n } from '@lingui/core';
import * as plurals from 'make-plural/plurals';
import { detect, fromNavigator } from '@lingui/detect-locale';

import { messages as messagesEm } from '@lingui/loader!/src/i18n/locales/en/translation.json?raw-lingui';
import { messages as messagesDe } from '@lingui/loader!/src/i18n/locales/de/translation.json?raw-lingui';

export const setupI18n = () => {
  const locale = detect(fromNavigator(), 'en').split('-')?.at(0) || 'en';

  i18n.loadLocaleData({
    [locale]: { plurals: plurals[locale] },
  });
  i18n.load({ en: messagesEm, de: messagesDe });
  i18n.activate(locale);
};
