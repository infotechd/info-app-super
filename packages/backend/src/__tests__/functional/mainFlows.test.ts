import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../app';

/**
 * Teste 1 — Funcionalidade: fluxos principais funcionando do início ao fim
 *
 * Cenário coberto (E2E básico via HTTP):
 *  - Registro de usuário (provider)
 *  - Login
 *  - Acesso a rota protegida /auth/profile
 *  - CRUD básico de OfertaServico: criar, listar, obter, atualizar, deletar
 *
 * Observações:
 *  - Usa MongoDB em memória para isolamento (mongodb-memory-server)
 *  - Não cobre upload/GridFS aqui para manter o escopo mínimo do Teste 1
 */

describe('Teste 1 - Fluxos principais E2E (Auth + Ofertas)', () => {
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
  });

  beforeEach(async () => {
    // Limpa o banco entre testes
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    for (const c of collections) {
      await db.collection(c.name).deleteMany({});
    }
  });

  it('deve executar o fluxo completo: register -> login -> profile -> ofertas CRUD', async () => {
    // 1) Register (provider)
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        nome: 'Prestador Teste',
        email: 'provider@test.com',
        senha: 'secret123',
        tipo: 'provider', // será transformado para 'prestador' no schema
      });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body?.success).toBe(true);
    expect(registerRes.body?.data?.token).toBeDefined();
    const tokenFromRegister: string = registerRes.body.data.token;

    // 2) Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'provider@test.com', senha: 'secret123' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body?.success).toBe(true);
    expect(loginRes.body?.data?.token).toBeDefined();
    const token: string = loginRes.body.data.token;

    // 3) Profile (rota protegida)
    const profileRes = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body?.success).toBe(true);
    expect(profileRes.body?.data?.user?.email).toBe('provider@test.com');
    expect(profileRes.body?.data?.user?.tipo).toBe('provider');

    // 4) Criar oferta (provider)
    const createOfertaRes = await request(app)
      .post('/api/ofertas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        titulo: 'Aula de React Native',
        descricao: 'Aulas práticas de RN com Expo, do básico ao avançado.',
        preco: 199.9,
        categoria: 'Tecnologia',
        localizacao: { cidade: 'São Paulo', estado: 'SP' },
      });

    expect(createOfertaRes.status).toBe(201);
    expect(createOfertaRes.body?.success).toBe(true);
    const ofertaId: string = createOfertaRes.body?.data?._id || createOfertaRes.body?.data?.id || createOfertaRes.body?.data?._id;
    expect(ofertaId).toBeTruthy();

    // 5) Listar ofertas (pública)
    const listRes = await request(app)
      .get('/api/ofertas')
      .query({ categoria: 'Tecnologia', limit: 10 });

    expect(listRes.status).toBe(200);
    expect(listRes.body?.success).toBe(true);
    expect(Array.isArray(listRes.body?.data?.ofertas)).toBe(true);
    expect(listRes.body?.data?.total).toBeGreaterThanOrEqual(1);

    // 6) Obter por ID (pública)
    const getByIdRes = await request(app)
      .get(`/api/ofertas/${ofertaId}`);
    expect(getByIdRes.status).toBe(200);
    expect(getByIdRes.body?.success).toBe(true);
    expect(getByIdRes.body?.data?._id || getByIdRes.body?.data?.id).toBeTruthy();

    // 7) Atualizar (protegida)
    const updateRes = await request(app)
      .put(`/api/ofertas/${ofertaId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ preco: 249.9 });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body?.success).toBe(true);
    expect(updateRes.body?.data?.preco).toBe(249.9);

    // 8) Deletar (protegida)
    const deleteRes = await request(app)
      .delete(`/api/ofertas/${ofertaId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body?.success).toBe(true);
  });
});
