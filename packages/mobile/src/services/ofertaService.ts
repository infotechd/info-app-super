import api from './api';
import { OfertaServico, CreateOfertaInput, OfertaFilters } from '@/types/oferta';
import { unwrapApiResponse } from '@/utils/api';

export interface OfertasResponse {
    ofertas: OfertaServico[];
    total: number;
    page: number;
    totalPages: number;
}



export const ofertaService = {
    async getOfertas(filters?: OfertaFilters, page = 1, limit = 10): Promise<OfertasResponse> {
        const params = new URLSearchParams();

        if (filters?.categoria) params.append('categoria', filters.categoria);
        if (filters?.precoMin) params.append('precoMin', filters.precoMin.toString());
        if (filters?.precoMax) params.append('precoMax', filters.precoMax.toString());
        if (filters?.cidade) params.append('cidade', filters.cidade);
        if (filters?.estado) params.append('estado', filters.estado);
        if (filters?.busca) params.append('busca', filters.busca);

        params.append('page', page.toString());
        params.append('limit', limit.toString());

        const response = await api.get(`/ofertas?${params.toString()}`);
        const data = unwrapApiResponse<OfertasResponse>(response.data, { defaultValue: { ofertas: [], total: 0, page, totalPages: 1 } });
        // Ensure safe defaults to prevent runtime crashes
        return {
            ofertas: Array.isArray(data?.ofertas) ? data.ofertas : [],
            total: typeof data?.total === 'number' ? data.total : 0,
            page: typeof data?.page === 'number' ? data.page : page,
            totalPages: typeof data?.totalPages === 'number' ? data.totalPages : 1,
        };
    },

    async getOfertaById(id: string): Promise<OfertaServico> {
        const response = await api.get(`/ofertas/${id}`);
        const data = unwrapApiResponse<OfertaServico>(response.data);
        return data;
    },

    async createOferta(data: CreateOfertaInput): Promise<OfertaServico> {
        const response = await api.post('/ofertas', data);
        const payload = unwrapApiResponse<OfertaServico>(response.data);
        return payload;
    },

    async updateOferta(id: string, data: Partial<CreateOfertaInput>): Promise<OfertaServico> {
        const response = await api.put(`/ofertas/${id}`, data);
        const payload = unwrapApiResponse<OfertaServico>(response.data);
        return payload;
    },

    async deleteOferta(id: string): Promise<void> {
        await api.delete(`/ofertas/${id}`);
    },

    async getMinhasOfertas(): Promise<OfertaServico[]> {
        const response = await api.get('/ofertas/minhas');
        const data = unwrapApiResponse<OfertaServico[] | { ofertas: OfertaServico[] }>(response.data);
        // Support either raw array or wrapped object
        const list = Array.isArray(data)
            ? data
            : Array.isArray((data as any)?.ofertas)
                ? (data as any).ofertas
                : [];
        return list;
    }
};

export default ofertaService;