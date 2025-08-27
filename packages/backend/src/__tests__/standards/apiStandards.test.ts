import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../app';

/**
 * Teste 2 — Padrões (API): formato ApiResponse, 404/validação, nomenclatura "imagens"
 */

describe('Padrões da API (ApiResponse + nomenclatura)', () => {
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

  it('GET / deve responder no formato ApiResponse', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        data: expect.objectContaining({ apiBase: '/api' }),
      })
    );
  });

  it('GET /api/health deve responder no formato ApiResponse', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        data: expect.objectContaining({ timestamp: expect.any(String) }),
      })
    );
  });

  it('rota desconhecida deve retornar 404 com ApiResponse padrão', async () => {
    const res = await request(app).get('/api/rota-inexistente');
    expect(res.status).toBe(404);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: expect.any(String),
        error: expect.any(String),
      })
    );
  });

  it('validação: register com email inválido retorna 400 com mensagem padronizada', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nome: 'Jo', email: 'invalido', senha: '123456', tipo: 'buyer' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Dados inválidos');
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it('nomenclatura: criar oferta com campo incorreto "imagem" deve ignorá-lo e manter data.imagens como []', async () => {
    // cria provider
    const r1 = await request(app).post('/api/auth/register').send({
      nome: 'Prestador', email: 'prov@std.com', senha: 'secret123', tipo: 'provider',
    });
    const token = r1.body?.data?.token as string;

    // cria oferta com campo incorreto "imagem"
    const res = await request(app)
      .post('/api/ofertas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        titulo: 'Serviço X',
        descricao: 'Desc YYYYYYYYY',
        preco: 10,
        categoria: 'Tecnologia',
        localizacao: { cidade: 'SP', estado: 'SP' },
        imagem: ['/api/upload/file/abc']
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body?.data?.imagens)).toBe(true);
    expect(res.body.data.imagens.length).toBe(0);
  });

  it('nomenclatura: criar oferta com campo correto "imagens" deve persistir links', async () => {
    // cria provider
    const r1 = await request(app).post('/api/auth/register').send({
      nome: 'Prestador2', email: 'prov2@std.com', senha: 'secret123', tipo: 'provider',
    });
    const token = r1.body?.data?.token as string;

    const res = await request(app)
      .post('/api/ofertas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        titulo: 'Serviço Z',
        descricao: 'Desc ZZZZZZZZZ',
        preco: 20,
        categoria: 'Tecnologia',
        localizacao: { cidade: 'SP', estado: 'SP' },
        imagens: ['/api/upload/file/id1']
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body?.data?.imagens)).toBe(true);
    expect(res.body.data.imagens.length).toBe(1);
    expect(res.body.data.imagens[0]).toBe('/api/upload/file/id1');
  });
});
