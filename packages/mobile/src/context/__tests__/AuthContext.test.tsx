import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Mock AsyncStorage já é provido por jest.setup.js
// Mock do authService para controlar retorno do login
jest.mock('@/services/authService', () => ({
  __esModule: true,
  authService: {
    login: jest.fn(async ({ email, password }) => {
      return {
        token: 'tok_test',
        user: {
          _id: 'u1',
          nome: 'Usuário Teste',
          email,
          tipo: 'buyer',
          createdAt: new Date().toISOString(),
        },
      };
    }),
    register: jest.fn(),
    logout: jest.fn(),
  },
}));

// Mock helpers de token do cliente HTTP
jest.mock('@/services/api', () => ({
  __esModule: true,
  setAuthToken: jest.fn(),
  clearAuthToken: jest.fn(),
  default: {},
}));

const TestComponent: React.FC = () => {
  const { login } = useAuth();
  React.useEffect(() => {
    // dispara um login de teste
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    login('test@login.com', 'Secret1');
  }, [login]);
  return null as any;
};

const TestLogoutFlow: React.FC = () => {
  const { login, logout, isAuthenticated } = useAuth();
  React.useEffect(() => {
    (async () => {
      await login('t@t.com', 'Secret1');
      await logout();
    })();
  }, [login, logout]);
  return <Text testID="auth-state">{isAuthenticated ? '1' : '0'}</Text> as any;
};

describe('AuthContext', () => {
  it('deve autenticar e persistir token/usuário após login', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      // Verifica AsyncStorage via mock (chaves simples 'token' e 'user')
      const AS = require('@react-native-async-storage/async-storage');
      const setItem: jest.Mock = AS.setItem;
      expect(setItem).toHaveBeenCalledWith('token', 'tok_test');
      // A chamada para 'user' deve ocorrer também
      const keys = setItem.mock.calls.map((c: any[]) => c[0]);
      expect(keys).toContain('user');
    });
  });

  it('deve limpar storage e token do cliente ao fazer logout', async () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestLogoutFlow />
      </AuthProvider>
    );

    await waitFor(() => {
      // clearAuthToken deve ser chamado
      const api = require('@/services/api');
      expect(api.clearAuthToken).toHaveBeenCalled();
      // AsyncStorage.multiRemove deve ser chamado com ['token', 'user']
      const AS = require('@react-native-async-storage/async-storage');
      const multiRemove: jest.Mock = AS.multiRemove;
      const calls = multiRemove.mock.calls;
      const hasTokenUser = calls.some((args: any[]) => Array.isArray(args[0]) && args[0].includes('token') && args[0].includes('user'));
      expect(hasTokenUser).toBe(true);
    });

    await waitFor(() => {
      // Estado autenticado deve ser falso
      const label = getByTestId('auth-state');
      expect(label.props.children).toBe('0');
    });
  });
});
