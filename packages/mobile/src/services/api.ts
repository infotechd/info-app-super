import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__
    ? 'http://192.168.15.12:4000/api'
    : 'https://your-production-api.com/api';

export const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para adicionar token
api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
        // Axios v1: headers can be AxiosHeaders or a plain object.
        // Use the .set API when available; otherwise merge into a plain object.
        const authValue = `Bearer ${token}`;
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
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
        }
        return Promise.reject(error);
    }
);

export default api;