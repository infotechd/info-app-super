import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { OfertaServico } from '../models/OfertaServico';
import { connectInMemoryMongo, disconnectInMemoryMongo, clearDatabase } from './utils/testDb';

/**
 * P2 - Performance
 * Verifica que a listagem de ofertas responde dentro de um tempo aceitável
 * com um dataset moderado.
 */

describe('P2 - Performance básica', () => {
  beforeAll(async () => {
    await connectInMemoryMongo();
  });
  afterAll(async () => {
    await disconnectInMemoryMongo();
  });
  beforeEach(async () => {
    await clearDatabase();
  });

  it('GET /api/ofertas deve responder < 500ms com ~50 registros', async () => {
    // Seed de ~50 ofertas diretamente via Mongoose (mais rápido que via API) – não influencia o tempo medido
    const prestadorId = new mongoose.Types.ObjectId();
    const baseDoc = {
      titulo: 'Serviço A',
      descricao: 'Descrição de serviço para testes de performance',
      preco: 100,
      categoria: 'Tecnologia',
      imagens: ['/api/upload/file/abc'],
      localizacao: { cidade: 'São Paulo', estado: 'SP', endereco: 'Rua A, 123' },
      prestador: { _id: prestadorId, nome: 'Prestador', avaliacao: 5 },
      status: 'ativo' as const,
    };
    const docs = Array.from({ length: 50 }, (_, i) => ({
      ...baseDoc,
      titulo: `Serviço ${i + 1}`,
      preco: 50 + i,
      localizacao: { cidade: i % 2 === 0 ? 'São Paulo' : 'Rio de Janeiro', estado: i % 2 === 0 ? 'SP' : 'RJ' },
    }));
    await OfertaServico.insertMany(docs);

    const start = Date.now();
    const res = await request(app).get('/api/ofertas').query({ limit: 10 });
    const duration = Date.now() - start;

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // assert tempo
    expect(duration).toBeLessThan(500);
  });
});
