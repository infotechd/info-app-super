import React from 'react';
import { render, waitFor, act, fireEvent } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import BuscarOfertasScreen from '../BuscarOfertasScreen';

// Helpers to create controllable promises
function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// Mocks
jest.mock('@/services/ofertaService', () => {
  const mockGetOfertas = jest.fn();
  return {
    __esModule: true,
    ofertaService: { getOfertas: mockGetOfertas },
    default: { getOfertas: mockGetOfertas },
    __mock__: { mockGetOfertas }
  };
});
// Access the mock function
// eslint-disable-next-line @typescript-eslint/no-var-requires
const serviceModule = require('@/services/ofertaService');
const getOfertasMock = serviceModule.__mock__.mockGetOfertas as jest.Mock;

describe('BuscarOfertasScreen - loading feedback', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    getOfertasMock.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows initial loader during first fetch and hides after resolve', async () => {
    // First call pending to simulate loading
    const first = deferred({ ofertas: [], total: 0, page: 1, totalPages: 1 });
    getOfertasMock.mockReturnValueOnce(first.promise);

    const { getByTestId, queryByTestId } = render(
      <PaperProvider>
        <BuscarOfertasScreen />
      </PaperProvider>
    );

    // During pending fetch, initial loader should be visible
    expect(getByTestId('initial-loader')).toBeTruthy();

    // Resolve first fetch
    await act(async () => {
      first.resolve({ ofertas: [], total: 0, page: 1, totalPages: 1 });
    });

    // Let all tasks flush
    await act(async () => {});

    // Initial loader should disappear
    await waitFor(() => expect(queryByTestId('initial-loader')).toBeNull());
  });

  it('shows footer loader when loading more results and hides after resolve', async () => {
    // First call resolves with one item and hasMore true (totalPages > page)
    getOfertasMock.mockResolvedValueOnce({
      ofertas: [
        {
          _id: '1',
          titulo: 'Serviço 1',
          descricao: 'Desc',
          preco: 100,
          categoria: 'Tecnologia',
          prestador: { _id: 'p1', nome: 'João', avaliacao: 4.5 },
          imagens: [],
          localizacao: { cidade: 'SP', estado: 'SP' },
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02'
        }
      ],
      total: 2,
      page: 1,
      totalPages: 2
    });

    // Second call (load more) stays pending to show footer loader
    const second = deferred({ ofertas: [], total: 2, page: 2, totalPages: 2 });
    getOfertasMock.mockReturnValueOnce(second.promise);

    const { getByTestId, queryByTestId } = render(
      <PaperProvider>
        <BuscarOfertasScreen />
      </PaperProvider>
    );

    // Wait first fetch
    await waitFor(() => expect(getOfertasMock).toHaveBeenCalledTimes(1));

    // Trigger onEndReached by scrolling the FlatList
    const list = getByTestId('ofertas-list');
    fireEvent.scroll(list, {
      nativeEvent: {
        contentOffset: { y: 1000 },
        contentSize: { height: 100 },
        layoutMeasurement: { height: 100 }
      }
    });

    // Footer loader should appear while second promise pending
    await waitFor(() => expect(getByTestId('footer-loader')).toBeTruthy());

    // Resolve second fetch
    await act(async () => {
      second.resolve({ ofertas: [], total: 2, page: 2, totalPages: 2 });
    });

    await waitFor(() => expect(queryByTestId('footer-loader')).toBeNull());
  });
});
