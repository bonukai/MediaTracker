import { init, changeLanguage } from 'i18next';
import { GlobalConfiguration } from 'src/repository/globalSettings';

import en from 'src/i18n/locale/en/translation.json';
import de from 'src/i18n/locale/de/translation.json';

const resources = <const>{
    en: { translation: en },
    de: { translation: de },
};

init({
    fallbackLng: 'en',
    lng: GlobalConfiguration.configuration.serverLang,
    interpolation: {
        escapeValue: false,
    },
    resources: resources,
});

GlobalConfiguration.subscribe('serverLang', (lng) => changeLanguage(lng));
