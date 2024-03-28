import type { LinguiConfig } from '@lingui/conf';
import { formatter } from '@lingui/format-json';

const config: LinguiConfig = {
  locales: ['da', 'de', 'en', 'es', 'fr', 'ko', 'pt'],
  catalogs: [
    {
      path: 'src/i18n/locales/{locale}/translation',
      include: ['src'],
    },
  ],
  fallbackLocales: {
    default: 'en',
  },
  format: formatter({ style: 'minimal' }),
  sourceLocale: 'en',
  compileNamespace: 'ts',
};

export default config;
