import { z } from 'zod';
import { VALIDATION_CONFIG, MESSAGES } from '@/constants';

// Schema de login
export const loginSchema = z.object({
    email: z
        .string()
        .min(1, MESSAGES.VALIDATION.REQUIRED)
        .email(MESSAGES.VALIDATION.EMAIL_INVALID),
    senha: z
        .string()
        .min(1, MESSAGES.VALIDATION.REQUIRED)
        .min(VALIDATION_CONFIG.PASSWORD_MIN_LENGTH, MESSAGES.VALIDATION.PASSWORD_MIN),
});

// Schema de registro
export const registerSchema = z.object({
    nome: z
        .string()
        .min(1, MESSAGES.VALIDATION.REQUIRED)
        .min(VALIDATION_CONFIG.NAME_MIN_LENGTH, MESSAGES.VALIDATION.NAME_MIN)
        .max(VALIDATION_CONFIG.NAME_MAX_LENGTH, MESSAGES.VALIDATION.NAME_MAX),
    email: z
        .string()
        .min(1, MESSAGES.VALIDATION.REQUIRED)
        .email(MESSAGES.VALIDATION.EMAIL_INVALID),
    senha: z
        .string()
        .min(1, MESSAGES.VALIDATION.REQUIRED)
        .min(VALIDATION_CONFIG.PASSWORD_MIN_LENGTH, MESSAGES.VALIDATION.PASSWORD_MIN),
    telefone: z
        .string()
        .regex(VALIDATION_CONFIG.PHONE_REGEX, MESSAGES.VALIDATION.PHONE_INVALID)
        .optional()
        .or(z.literal('')),
    tipo: z.enum(['comprador', 'prestador', 'anunciante']),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;