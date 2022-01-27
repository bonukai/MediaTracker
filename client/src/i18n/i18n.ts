import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from 'src/i18n/locale/en/translation.json';
import de from 'src/i18n/locale/de/translation.json';

const resources = <const>{
  en: { translation: en },
  de: { translation: de },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      transSupportBasicHtmlNodes: true,
    },
    resources: resources,
  });
