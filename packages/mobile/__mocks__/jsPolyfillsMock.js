// Mock for @react-native/js-polyfills to avoid loading Flow-typed polyfills during Jest tests
// This is sufficient for our unit tests; Expo/Jest will provide required globals.
module.exports = {};
