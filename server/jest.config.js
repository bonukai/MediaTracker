/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testPathIgnorePatterns: ['/__utils__/', '/__setup__/'],
    moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
    },
    maxConcurrency: 1,
    maxWorkers: 1,    
};
