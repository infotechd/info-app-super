import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import BuscarOfertasScreen from '../BuscarOfertasScreen';

// Mock ofertaService
const getOfertasMock = jest.fn().mockResolvedValue({ ofertas: [], total: 0, page: 1, totalPages: 1 });
jest.mock('@/services/ofertaService', () => {
  return {
    __esModule: true,
    ofertaService: { getOfertas: getOfertasMock },
    default: { getOfertas: getOfertasMock }
  };
});

describe('BuscarOfertasScreen - debounce search', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    getOfertasMock.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('calls getOfertas once on mount and debounces rapid typing to a single additional call', async () => {
    const { getByPlaceholderText } = render(
      <PaperProvider>
        <BuscarOfertasScreen />
      </PaperProvider>
    );

    // Initial load
    await waitFor(() => expect(getOfertasMock).toHaveBeenCalledTimes(1));

    const input = getByPlaceholderText('Buscar serviços...');

    // Rapid typing
    fireEvent.changeText(input, 'p');
    fireEvent.changeText(input, 'pl');
    fireEvent.changeText(input, 'plu');
    fireEvent.changeText(input, 'plum');
    fireEvent.changeText(input, 'plumb');

    // Before debounce time, no extra calls
    expect(getOfertasMock).toHaveBeenCalledTimes(1);

    // Advance just before threshold
    await act(async () => {
      jest.advanceTimersByTime(399);
    });
    expect(getOfertasMock).toHaveBeenCalledTimes(1);

    // Cross the threshold
    await act(async () => {
      jest.advanceTimersByTime(1);
    });

    // Wait for the debounced fetch
    await waitFor(() => expect(getOfertasMock).toHaveBeenCalledTimes(2));

    // Ensure last call used the debounced query
    const lastCallArgs = getOfertasMock.mock.calls[getOfertasMock.mock.calls.length - 1];
    const filtersArg = lastCallArgs[0];
    expect(filtersArg).toMatchObject({ busca: 'plumb' });
  });
});
