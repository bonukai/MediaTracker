import { i18n } from '@lingui/core';
import { t } from '@lingui/macro';
import * as plurals from 'make-plural/plurals';

import { messages as de } from 'src/i18n/locales/de/translation';
import { messages as en } from 'src/i18n/locales/en/translation';
import { messages as es } from 'src/i18n/locales/es/translation';

import { GlobalConfiguration } from 'src/repository/globalSettings';

export const setupI18n = (locale: string) => {
    i18n.loadLocaleData({
        de: { plurals: plurals.de },
        en: { plurals: plurals.en },
        es: { plurals: plurals.es },
    });
    i18n.load({ de: de, en: en, es: es });
    i18n.activate(locale);

    GlobalConfiguration.subscribe('serverLang', (lng) => {
        if (i18n.locale === lng || !lng) {
            return;
        }

        console.log(t`Changing server language to ${lng}`);
        i18n.activate(lng);
    });
};
