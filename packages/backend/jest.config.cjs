/**
 * Jest configuration for Super App backend (TypeScript + Node)
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src'],
  setupFiles: ['<rootDir>/jest.setup.ts'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  // Keep coverage collection on, but no strict thresholds here to avoid failing the pipeline initially.
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/server.ts',
    '!src/types/**/*.ts',
    '!src/**/__tests__/**'
  ],
  coverageDirectory: '<rootDir>/coverage'
};