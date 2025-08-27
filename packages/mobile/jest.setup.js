import 'react-native-gesture-handler/jestSetup';

// Mock Reanimated
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Silence React Native logs in tests (algumas versões não possuem este caminho)
try {
  jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
} catch {
  // Cria um mock virtual caso o módulo não exista nesta versão do RN
  jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), { virtual: true });
}

// Mock vector-icons to avoid native issues
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

// Mock expo-constants used by config
jest.mock('expo-constants', () => ({
  default: { expoConfig: {} },
}));

// Mock expo-updates used by config
jest.mock('expo-updates', () => ({
  channel: 'production',
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
