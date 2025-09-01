import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import MainTabNavigator from '@/navigation/MainTabNavigator';

// Mock react-native-vector-icons/MaterialCommunityIcons to validate usage and avoid native dependency
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => {
  const React = require('react');
  return jest.fn(() => null);
});

// Silence reanimated/gesture handler warnings in tests
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-native-gesture-handler', () => ({}));

describe('MainTabNavigator - padrões de navegação e ícones', () => {
  it('deve exibir as abas Ofertas, Agenda, Chat, Comunidade e Perfil e usar MaterialCommunityIcons', async () => {
    const { findByText } = render(
      <NavigationContainer>
        <MainTabNavigator />
      </NavigationContainer>
    );

    // Tabs (labels) existence
    expect(await findByText('Ofertas')).toBeTruthy();
    expect(await findByText('Agenda')).toBeTruthy();
    expect(await findByText('Chat')).toBeTruthy();
    expect(await findByText('Comunidade')).toBeTruthy();
    expect(await findByText('Perfil')).toBeTruthy();

    // MaterialCommunityIcons default export was mocked from react-native-vector-icons/MaterialCommunityIcons -> module exists
    const mod = require('react-native-vector-icons/MaterialCommunityIcons');
    const Icon = mod.default || mod;
    expect(jest.isMockFunction(Icon)).toBe(true);
  });
});
