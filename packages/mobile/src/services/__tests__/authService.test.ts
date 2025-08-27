// Mock do módulo de API usado pelo AuthService (deve coincidir com o import './api' do SUT)
jest.mock('../api', () => {
  const post = jest.fn();
  return {
    __esModule: true,
    default: { post },
    api: { post },
  };
});

// Mock da configuração para evitar dependências nativas do Expo em testes
jest.mock('@/constants/config', () => ({
  API_CONFIG: { endpoints: { auth: '/auth' } },
}), { virtual: true });

// Helper para acessar o mock
const getPostMock = () => {
  const mod = require('../api');
  return mod.default.post as jest.Mock;
};

let authService: any;

describe('AuthService', () => {
  beforeEach(() => {
    getPostMock().mockReset();
    // Isola o módulo para aplicar corretamente os mocks acima
    jest.isolateModules(() => {
      authService = require('../authService').authService;
    });
  });

  it('deve fazer login mapeando password -> senha e normalizar o usuário', async () => {
    const post = getPostMock();
    post.mockResolvedValueOnce({
      data: {
        token: 'token123',
        user: { _id: '1', nome: 'Ana', email: 'ana@test.com', tipo: 'comprador' },
      },
    });

    const res = await authService.login({ email: 'ana@test.com', password: 'Secret1' });

    // Verifica corpo enviado
    const [url, body] = post.mock.calls[0];
    expect(url).toBe('/auth/login');
    expect(body).toEqual({ email: 'ana@test.com', senha: 'Secret1' });

    // Verifica normalização
    expect(res.token).toBe('token123');
    expect(res.user.email).toBe('ana@test.com');
    expect(res.user.tipo).toBe('buyer'); // convertido de 'comprador' -> 'buyer'
  });

  it('deve registrar mapeando password/tipo e normalizar o usuário', async () => {
    const post = getPostMock();
    post.mockResolvedValueOnce({
      data: {
        token: 't-abc',
        user: { _id: '2', nome: 'Bob', email: 'bob@test.com', tipo: 'prestador' },
      },
    });

    const res = await authService.register({
      nome: 'Bob',
      email: 'bob@test.com',
      password: 'Secret1',
      tipo: 'provider',
    });

    const [url, body] = post.mock.calls[0];
    expect(url).toBe('/auth/register');
    expect(body).toMatchObject({
      nome: 'Bob',
      email: 'bob@test.com',
      senha: 'Secret1',
      tipo: 'prestador',
    });

    expect(res.user.tipo).toBe('provider');
  });

  it('deve propagar mensagem de erro do backend no login', async () => {
    const post = getPostMock();
    post.mockRejectedValueOnce({ response: { data: { message: 'Credenciais inválidas' } } });

    await expect(
      authService.login({ email: 'x@test.com', password: 'wrong' })
    ).rejects.toThrow('Credenciais inválidas');
  });

  it('deve aceitar tipo em inglês vindo do backend (provider) e manter provider após normalização no login', async () => {
    const post = getPostMock();
    post.mockResolvedValueOnce({
      data: {
        token: 'tok-en',
        user: { _id: '42', nome: 'Carol', email: 'carol@test.com', tipo: 'provider' },
      },
    });

    const res = await authService.login({ email: 'carol@test.com', password: 'Secret1' });

    expect(res.token).toBe('tok-en');
    expect(res.user.email).toBe('carol@test.com');
    expect(res.user.tipo).toBe('provider');
  });
});
