import Constants from 'expo-constants';

// Configuração da API
export const API_CONFIG = {
    BASE_URL: __DEV__
        ? 'http://localhost:3000/api'
        : 'https://your-production-api.com/api',
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
};

// Configuração do app
export const APP_CONFIG = {
    NAME: 'Super App',
    VERSION: Constants.expoConfig?.version || '1.0.0',
    BUILD_NUMBER: Constants.expoConfig?.ios?.buildNumber || '1',
};

// Configuração de storage
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    USER_DATA: 'user_data',
    THEME: 'theme_preference',
    LANGUAGE: 'language_preference',
} as const;

// Configuração de validação
export const VALIDATION_CONFIG = {
    PASSWORD_MIN_LENGTH: 6,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    PHONE_REGEX: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
    EMAIL_REGEX: /^\S+@\S+\.\S+$/,
};

// Configuração de tema
export const THEME_CONFIG = {
    COLORS: {
        PRIMARY: '#6366f1',
        SECONDARY: '#8b5cf6',
        SUCCESS: '#10b981',
        WARNING: '#f59e0b',
        ERROR: '#ef4444',
        INFO: '#3b82f6',
        BACKGROUND: '#ffffff',
        SURFACE: '#f8fafc',
        TEXT: '#1f2937',
        TEXT_SECONDARY: '#6b7280',
    },
    SPACING: {
        XS: 4,
        SM: 8,
        MD: 16,
        LG: 24,
        XL: 32,
        XXL: 48,
    },
    BORDER_RADIUS: {
        SM: 4,
        MD: 8,
        LG: 12,
        XL: 16,
        FULL: 9999,
    },
};