import api from './api';
import { User, RegisterData, LoginData } from '@/types';
import { unwrapApiResponse } from '@/utils/api';

export interface LoginResponse {
    user: User;
    token: string;
}


export const authService = {
    async login(data: LoginData): Promise<LoginResponse> {
        const response = await api.post('/auth/login', data);
        return unwrapApiResponse<LoginResponse>(response.data, { strict: true });
    },

    async register(data: RegisterData): Promise<LoginResponse> {
        const response = await api.post('/auth/register', data);
        return unwrapApiResponse<LoginResponse>(response.data, { strict: true });
    },

    async getProfile(): Promise<User> {
        const response = await api.get('/auth/profile');
        return unwrapApiResponse<User>(response.data, { strict: true });
    },

    async logout(): Promise<void> {
        await api.post('/auth/logout');
    },

    async forgotPassword(email: string): Promise<void> {
        await api.post('/auth/forgot-password', { email });
    }
};

export default authService;