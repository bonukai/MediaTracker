/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/__utils__/', '/__setup__/', 'build'],
  modulePathIgnorePatterns: ['build'],
  transform: {
    '^.+\\.[t|j]sx?$': 'babel-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/i18n/locales',
  ],
  reporters: ['default', 'jest-junit'],
  testLocationInResults: true,
  testTimeout: 30000
};
