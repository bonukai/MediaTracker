import { init } from 'i18next';
import { LANG } from 'src/config';

import en from 'src/i18n/locale/en/translation.json';
import de from 'src/i18n/locale/de/translation.json';

const resources = <const>{
    en: { translation: en },
    de: { translation: de },
};

init({
    fallbackLng: 'en',
    lng: LANG,
    interpolation: {
        escapeValue: false,
    },
    resources: resources,
});
