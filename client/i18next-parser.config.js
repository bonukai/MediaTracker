// eslint-disable-next-line no-undef
module.exports = {
  locales: ['en', 'de'],
  output: 'src/i18n/locale/$LOCALE/$NAMESPACE.json',
  input: 'src/**/*.{ts,tsx,js,jsx}',
  sort: true,
  createOldCatalogs: false,
  keySeparator: false,
  namespaceSeparator: false,
  defaultValue: (locale, namespace, key) => (locale === 'en' ? key : ''),
  skipDefaultValues: (locale, namespace, key) => locale !== 'en',
};
