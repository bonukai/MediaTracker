import { i18n } from '@lingui/core';

import { messages as da } from './locales/da/translation.js';
import { messages as de } from './locales/de/translation.js';
import { messages as en } from './locales/en/translation.js';
import { messages as es } from './locales/es/translation.js';
import { messages as fr } from './locales/fr/translation.js';
import { messages as ko } from './locales/ko/translation.js';
import { messages as pt } from './locales/pt/translation.js';

export const setupI18n = () => {
  const messages = {
    da,
    de,
    en,
    es,
    fr,
    ko,
    pt,
  };
  i18n.load(messages);
};
