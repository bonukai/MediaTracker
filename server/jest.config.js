/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testPathIgnorePatterns: ['/__utils__/', '/__setup__/'],
    maxConcurrency: 1,
    maxWorkers: 1,
    transform: {
        '^.+\\.[t|j]sx?$': 'babel-jest',
    },
};
