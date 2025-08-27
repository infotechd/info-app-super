import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '@/screens/auth/RegisterScreen';
import { MESSAGES } from '@/constants/messages';
import { act } from 'react-test-renderer';

jest.mock('@/services/authService', () => ({
  AuthService: {
    register: jest.fn(),
  },
}));

const { AuthService } = jest.requireMock('@/services/authService');

describe('RegisterScreen', () => {
  const makeNav = () => ({
    replace: jest.fn(),
    navigate: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows required validation messages on empty submit', async () => {
    const navigation = makeNav();
    const { getByTestId, findAllByText } = render(
      // @ts-ignore - minimal props for testing
      <RegisterScreen navigation={navigation} route={{ key: 'Register', name: 'Register' as any }} />
    );

    fireEvent.press(getByTestId('btn-registrar'));

    const requireds = await findAllByText(MESSAGES.VALIDATION.REQUIRED);
    expect(requireds.length).toBeGreaterThanOrEqual(3); // nome, email, senha
  });

  it('validates invalid email and short password', async () => {
    const navigation = makeNav();
    const { getByTestId, findByText } = render(
      // @ts-ignore
      <RegisterScreen navigation={navigation} route={{ key: 'Register', name: 'Register' as any }} />
    );

    fireEvent.changeText(getByTestId('input-nome'), 'J');
    fireEvent.changeText(getByTestId('input-email'), 'invalid-email');
    fireEvent.changeText(getByTestId('input-password'), '123');

    fireEvent.press(getByTestId('btn-registrar'));

    expect(await findByText(MESSAGES.VALIDATION.NAME_MIN)).toBeTruthy();
    expect(await findByText(MESSAGES.VALIDATION.EMAIL_INVALID)).toBeTruthy();
    expect(await findByText(MESSAGES.VALIDATION.PASSWORD_MIN)).toBeTruthy();
  });

  it('validates phone format when provided', async () => {
    const navigation = makeNav();
    const { getByTestId, findByText } = render(
      // @ts-ignore
      <RegisterScreen navigation={navigation} route={{ key: 'Register', name: 'Register' as any }} />
    );

    fireEvent.changeText(getByTestId('input-nome'), 'João da Silva');
    fireEvent.changeText(getByTestId('input-email'), 'test@example.com');
    fireEvent.changeText(getByTestId('input-password'), '123456');
    fireEvent.changeText(getByTestId('input-telefone'), '123');

    fireEvent.press(getByTestId('btn-registrar'));

    expect(await findByText(MESSAGES.VALIDATION.PHONE_INVALID)).toBeTruthy();
  });

  it('submits successfully and navigates to Login', async () => {
    jest.useFakeTimers();
    (AuthService.register as jest.Mock).mockResolvedValue({ success: true, data: { _id: '1', nome: 'Teste', email: 't@t.com', tipo: 'comprador' } });

    const navigation = makeNav();
    const { getByTestId, findByText } = render(
      // @ts-ignore
      <RegisterScreen navigation={navigation} route={{ key: 'Register', name: 'Register' as any }} />
    );

    fireEvent.changeText(getByTestId('input-nome'), 'João da Silva');
    fireEvent.changeText(getByTestId('input-email'), 'test@example.com');
    fireEvent.changeText(getByTestId('input-password'), '123456');
    // telefone optional, skip or provide valid

    fireEvent.press(getByTestId('btn-registrar'));

    await waitFor(() => expect(AuthService.register).toHaveBeenCalled());
    // Snackbar message appears
    expect(await findByText(MESSAGES.SUCCESS.REGISTER)).toBeTruthy();

    // Advance timers to allow navigation.replace to be called
    jest.runAllTimers();
    expect(navigation.replace).toHaveBeenCalledWith('Login');
    jest.useRealTimers();
  });
});


// New test: ensure tipo selector is visible, can change, and en-US tipo is passed
it('allows selecting user type and sends en-US tipo to AuthService', async () => {
  const navigation = makeNav();
  (AuthService.register as jest.Mock).mockResolvedValue({ token: 't', user: { _id: '1', nome: 'X', email: 'x@x.com', tipo: 'buyer' } });

  const { getByTestId, getByText } = render(
    // @ts-ignore
    <RegisterScreen navigation={navigation} route={{ key: 'Register', name: 'Register' as any }} />
  );

  // Fill required fields
  fireEvent.changeText(getByTestId('input-nome'), 'João da Silva');
  fireEvent.changeText(getByTestId('input-email'), 'test@example.com');
  fireEvent.changeText(getByTestId('input-password'), '123456');

  // Change tipo to Provider via SegmentedButtons label
  fireEvent.press(getByText('Prestador'));

  fireEvent.press(getByTestId('btn-registrar'));

  await waitFor(() => expect(AuthService.register).toHaveBeenCalled());
  expect(AuthService.register).toHaveBeenCalledWith(expect.objectContaining({
    tipo: 'provider',
    password: '123456',
  }));
});
