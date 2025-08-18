import dotenv from 'dotenv';
import * as process from "node:process";

// Carregar variáveis de ambiente do arquivo .env (se existir)
dotenv.config();

// Helper para booleanos vindos do env
const toBool = (v: string | undefined, fallback = false) => {
    if (v === undefined) return fallback;
    const val = v.trim().toLowerCase();
    return val === '1' || val === 'true' || val === 'yes';
};

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';

// Transforma "http://localhost:5173,http://127.0.0.1:5173" em ["http://localhost:5173", "http://127.0.0.1:5173"]
const CORS_ORIGIN_RAW = process.env.CORS_ORIGIN || '';
const CORS_ALLOWED_ORIGINS = CORS_ORIGIN_RAW
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);


const config = {
    NODE_ENV,
    IS_PROD,
    PORT: Number(process.env.PORT) || 4000,
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    // Lista de origens permitidas (derivada de CORS_ORIGIN)
    CORS_ALLOWED_ORIGINS,
    // Conjunto para checagens rápidas: usado em server.ts (config.CORS_ALLOWED_ORIGINS_SET.has(origin))
    CORS_ALLOWED_ORIGINS_SET: new Set<string>(CORS_ALLOWED_ORIGINS),
    // Suporta MONGO_URI e MONGODB_URI (compatível com .env atual)
    MONGO_URI: process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/super-app',
    JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
    // Não pular DB por padrão; exige definição explícita para ignorar DB
    SKIP_DB: toBool(process.env.SKIP_DB, false),
};

export default config;
