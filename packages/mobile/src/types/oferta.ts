export interface OfertaServico {
    _id: string;
    titulo: string;
    descricao: string;
    preco: number;
    categoria: string;
    prestador: {
        _id: string;
        nome: string;
        avatar?: string;
        avaliacao: number;
    };
    imagens: string[]; // IMPORTANTE: é 'imagens', não 'imagem'
    localizacao: {
        cidade: string;
        estado: string;
        endereco?: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface CreateOfertaInput {
    titulo: string;
    descricao: string;
    preco: number;
    categoria: string;
    imagens?: File[];
    localizacao: {
        cidade: string;
        estado: string;
        endereco?: string;
    };
}

export interface OfertaFilters {
    categoria?: string;
    precoMin?: number;
    precoMax?: number;
    cidade?: string;
    estado?: string;
    busca?: string;
}