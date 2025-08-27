import React from 'react';
import { render, screen } from '@testing-library/react-native';
import ProfileHome from '@/screens/profile/ProfileHome';

jest.mock('@/context/AuthContext', () => {
  return {
    __esModule: true,
    useAuth: () => ({
      user: {
        _id: '1',
        nome: 'Ana',
        email: 'ana@test.com',
        tipo: 'buyer',
        createdAt: new Date().toISOString(),
      },
      logout: jest.fn(),
      isAuthenticated: true,
      token: 't',
    }),
  };
});

describe('ProfileHome - tipo em PT-BR', () => {
  it('deve exibir o tipo do usuário em português', () => {
    render(<ProfileHome />);
    expect(screen.getByText('Tipo: Comprador')).toBeTruthy();
  });
});
