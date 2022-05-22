import { i18n } from '@lingui/core';
import { t } from '@lingui/macro';
import * as plurals from 'make-plural/plurals';

import { logger } from 'src/logger';
import { GlobalConfiguration } from 'src/repository/globalSettings';

import { messages as da } from 'src/i18n/locales/da/translation';
import { messages as de } from 'src/i18n/locales/de/translation';
import { messages as en } from 'src/i18n/locales/en/translation';
import { messages as es } from 'src/i18n/locales/es/translation';
import { messages as pt } from 'src/i18n/locales/pt/translation';

export const setupI18n = (locale: string) => {
  i18n.loadLocaleData({
    da: { plurals: plurals.da },
    de: { plurals: plurals.de },
    en: { plurals: plurals.en },
    es: { plurals: plurals.es },
    pt: { plurals: plurals.pt },
  });
  i18n.load({ da: da, de: de, en: en, es: es, pt: pt });
  i18n.activate(locale);

  GlobalConfiguration.subscribe('serverLang', (lng) => {
    if (i18n.locale === lng || !lng) {
      return;
    }

    logger.info(t`Changing server language to ${lng}`);
    i18n.activate(lng);
  });
};
