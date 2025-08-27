/**
 * Jest config for Super App Mobile (Expo SDK 53)
 */
module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '@react-native/js-polyfills/(.*)$': '<rootDir>/__mocks__/rn-polyfill-stub.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|react-clone-referenced-element|@react-navigation|@react-native-async-storage|expo(nent)?|@expo(nent)?/.*|expo-modules-core|react-native-reanimated|react-native-gesture-handler|react-native-vector-icons)/)'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/screens/app/__tests__/'
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/types/**',
  ],
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 40,
      lines: 40,
      statements: 40,
    },
  },
  coverageDirectory: '<rootDir>/coverage'
};
