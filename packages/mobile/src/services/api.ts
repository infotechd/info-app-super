import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Autodetecção de IPs do backend em desenvolvimento
 * - Casa: 192.168.15.12 (comentado abaixo)
 * - Trabalho: 192.168.1.12 (comentado abaixo)
 * - Emulador Android: 10.0.2.2
 * - iOS Simulator: 127.0.0.1
 *
 * Em produção, a URL permanece fixa (configure seu domínio de produção).
 */
const CANDIDATE_BASE_URLS: string[] = [
  'http://192.168.15.12:4000/api', // Casa — IP da sua casa
  'http://192.168.1.12:4000/api',  // Trabalho — IP do seu trabalho
  'http://10.0.2.2:4000/api',      // Emulador Android (host do PC)
  'http://127.0.0.1:4000/api',     // iOS Simulator (host local)
];

// Endpoint leve já existente no backend
const HEALTH_PATH = '/health'; // GET /api/health
const PING_TIMEOUT_MS = 1200;
const CACHE_KEY = 'api_base_url_selected';

async function ping(url: string): Promise<boolean> {
  try {
    const ctl = new AbortController();
    const id = setTimeout(() => ctl.abort(), PING_TIMEOUT_MS);
    const res = await fetch(url, { method: 'GET', signal: ctl.signal });
    clearTimeout(id);
    return res.ok;
  } catch {
    return false;
  }
}

async function pickReachableBaseURL(): Promise<string> {
  // 1) Tenta cache
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const ok = await ping(`${cached}${HEALTH_PATH}`);
      if (ok) return cached;
    }
  } catch {}

  // 2) Tenta as candidatas em ordem
  for (const base of CANDIDATE_BASE_URLS) {
    const ok = await ping(`${base}${HEALTH_PATH}`);
    if (ok) {
      await AsyncStorage.setItem(CACHE_KEY, base);
      return base;
    }
  }

  // 3) Fallback: primeira (Casa)
  const fallback = CANDIDATE_BASE_URLS[0];
  await AsyncStorage.setItem(CACHE_KEY, fallback);
  return fallback;
}

// Base inicial: em dev usa a primeira candidata (Casa) até autodetecção ajustar;
// em produção, use sua URL pública.
const API_BASE_URL = __DEV__
  ? CANDIDATE_BASE_URLS[0] // Casa — inicial até detectar melhor opção
  : 'https://your-production-api.com/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mantém um token em memória para evitar leituras frequentes do AsyncStorage
let currentToken: string | null = null;

// Helpers para gerenciar o token no cliente HTTP
export function setAuthToken(token: string | null): void {
  currentToken = token ?? null;
  const authHeader = token ? `Bearer ${token}` : undefined;
  const h: any = (api.defaults.headers as any).common ?? (api.defaults.headers as any);
  if (typeof h.set === 'function') {
    // AxiosHeaders
    if (authHeader) {
      h.set('Authorization', authHeader);
    } else {
      h.delete?.('Authorization');
    }
  } else {
    if (authHeader) {
      h.Authorization = authHeader;
    } else {
      delete h.Authorization;
    }
  }
}

export function clearAuthToken(): void {
  setAuthToken(null);
}

// Interceptor para adicionar token
api.interceptors.request.use(async (config) => {
  // Aguarda autodetecção inicial em desenvolvimento, para evitar 1ª requisição no IP errado
  if (__DEV__ && detectionPromise) {
    try { await detectionPromise; } catch {} finally { detectionPromise = null; }
  }

  // Usa token em memória; se não houver, tenta resgatar do AsyncStorage uma única vez
  if (!currentToken) {
    const stored = await AsyncStorage.getItem('token');
    if (stored) setAuthToken(stored);
  }
  if (currentToken) {
    const authValue = `Bearer ${currentToken}`;
    if (config.headers && typeof (config.headers as any).set === 'function') {
      (config.headers as any).set('Authorization', authValue);
    } else {
      config.headers = {
        ...(config.headers as Record<string, string> | undefined),
        Authorization: authValue,
      } as any;
    }
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      clearAuthToken();
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

/**
 * Autodetecção em background (somente em desenvolvimento):
 * - Testa o cache e depois os IPs: Casa, Trabalho, Emuladores
 * - Atualiza api.defaults.baseURL assim que encontrar um que responda
 * - Salva a escolha no AsyncStorage para os próximos inícios
 */
let detectionPromise: Promise<void> | null = null;
if (__DEV__) {
  detectionPromise = (async () => {
    try {
      const base = await pickReachableBaseURL();
      if (base && base !== api.defaults.baseURL) {
        api.defaults.baseURL = base;
      }
    } catch {
      // Mantém base inicial se falhar a autodetecção
    }
  })();
}

// Helper opcional para mudar manualmente a base (ex.: tela de debug)
export async function overrideBaseURL(url: string) {
  api.defaults.baseURL = url;
  await AsyncStorage.setItem(CACHE_KEY, url);
}

export default api;