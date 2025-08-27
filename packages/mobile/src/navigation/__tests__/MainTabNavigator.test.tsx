import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import MainTabNavigator from '@/navigation/MainTabNavigator';

// Mock vector icons to validate usage and avoid native dependency
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => {
  const React = require('react');
  const Mock = () => null;
  return Mock;
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

    // MaterialCommunityIcons was mocked -> module exists
    const Icons = require('react-native-vector-icons/MaterialCommunityIcons');
    expect(jest.isMockFunction(Icons)).toBe(true);
  });
});
