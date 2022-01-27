// eslint-disable-next-line no-undef
module.exports = {
    locales: ['en', 'de'],
    output: 'src/i18n/locale/$LOCALE/$NAMESPACE.json',
    input: 'src/**/*.{ts,js}',
    sort: true,
    createOldCatalogs: false,
    keySeparator: false,
    namespaceSeparator: false,
    defaultValue: (locale, namespace, key) => (locale === 'en' ? key : ''),
    skipDefaultValues: (locale, namespace, key) => locale !== 'en',
};
