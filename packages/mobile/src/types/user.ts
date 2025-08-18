export interface User {
    _id: string;
    nome: string;
    email: string;
    tipo: 'buyer' | 'provider' | 'advertiser';
    avatar?: string;
    telefone?: string;
    localizacao?: {
        cidade: string;
        estado: string;
    };
    avaliacao?: number;
    createdAt: string;
}

export interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
}

export interface RegisterData {
    nome: string;
    email: string;
    password: string;
    tipo: 'buyer' | 'provider' | 'advertiser';
    telefone?: string;
}

export interface LoginData {
    email: string;
    password: string;
}