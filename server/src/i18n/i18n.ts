import { i18n } from '@lingui/core';
import { t } from '@lingui/macro';
import { en, de } from 'make-plural/plurals';

import { messages as messagesEn } from 'src/i18n/locales/en/translation';
import { messages as messagesDe } from 'src/i18n/locales/de/translation';

import { GlobalConfiguration } from 'src/repository/globalSettings';

export const setupI18n = (locale: string) => {
    i18n.loadLocaleData({
        en: { plurals: en },
        de: { plurals: de },
    });
    i18n.load({ en: messagesEn, de: messagesDe });
    i18n.activate(locale);

    GlobalConfiguration.subscribe('serverLang', (lng) => {
        if (i18n.locale === lng) {
            return;
        }

        console.log(t`Changing server language to ${lng}`);
        i18n.activate(lng);
    });
};
