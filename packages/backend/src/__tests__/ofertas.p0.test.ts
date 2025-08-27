import request from 'supertest';
import app from '../app';
import { connectInMemoryMongo, disconnectInMemoryMongo, clearDatabase } from './utils/testDb';

const providerPayload = { nome: 'Prov', email: 'prov@example.com', senha: 'Senha@123', tipo: 'provider' as const };
const provider2Payload = { nome: 'Prov2', email: 'prov2@example.com', senha: 'Senha@123', tipo: 'provider' as const };

describe('P0 - Ofertas CRUD básico', () => {
  let token: string;
  let token2: string;

  beforeAll(async () => {
    await connectInMemoryMongo();
  });
  afterAll(async () => {
    await disconnectInMemoryMongo();
  });
  beforeEach(async () => {
    await clearDatabase();
    const reg = await request(app).post('/api/auth/register').send(providerPayload).expect(201);
    token = reg.body.data.token as string;
    const reg2 = await request(app).post('/api/auth/register').send(provider2Payload).expect(201);
    token2 = reg2.body.data.token as string;
  });

  const makeOferta = () => ({
    titulo: 'Serviço de Jardinagem',
    descricao: 'Corte de grama e poda de arbustos em residências e condomínios.',
    preco: 150,
    categoria: 'Jardinagem',
    imagens: ['/api/upload/file/abc'],
    localizacao: { cidade: 'São Paulo', estado: 'SP', endereco: 'Rua A, 123' },
    tags: ['jardim', 'poda']
  });

  it('POST /api/ofertas should create oferta (201) for provider', async () => {
    const res = await request(app)
      .post('/api/ofertas')
      .set('Authorization', `Bearer ${token}`)
      .send(makeOferta());

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data.imagens)).toBe(true);
  });

  it('POST /api/ofertas should validate payload (400)', async () => {
    const res = await request(app)
      .post('/api/ofertas')
      .set('Authorization', `Bearer ${token}`)
      .send({ titulo: '', preco: -5 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Dados inválidos');
  });

  it('GET /api/ofertas should return paginated list', async () => {
    await request(app).post('/api/ofertas').set('Authorization', `Bearer ${token}`).send(makeOferta()).expect(201);
    const res = await request(app).get('/api/ofertas');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ page: 1 });
    expect(Array.isArray(res.body.data.ofertas)).toBe(true);
  });

  it('GET /api/ofertas/:id should return 200 for existing and 404 for non-existing', async () => {
    const created = await request(app)
      .post('/api/ofertas')
      .set('Authorization', `Bearer ${token}`)
      .send(makeOferta())
      .expect(201);
    const id = created.body.data._id || created.body.data.id;

    const getOk = await request(app).get(`/api/ofertas/${id}`);
    expect(getOk.status).toBe(200);
    expect(getOk.body.success).toBe(true);

    const notFound = await request(app).get('/api/ofertas/64b4c0f0f0f0f0f0f0f0f0f0');
    expect([404, 400]).toContain(notFound.status);
  });

  it('PUT /api/ofertas/:id should allow owner update and forbid others (403)', async () => {
    const created = await request(app)
      .post('/api/ofertas')
      .set('Authorization', `Bearer ${token}`)
      .send(makeOferta())
      .expect(201);
    const id = created.body.data._id || created.body.data.id;

    const ok = await request(app)
      .put(`/api/ofertas/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ preco: 200 });
    expect(ok.status).toBe(200);
    expect(ok.body.success).toBe(true);

    const forbidden = await request(app)
      .put(`/api/ofertas/${id}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ preco: 250 });
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.success).toBe(false);
  });

  it('DELETE /api/ofertas/:id should remove by owner and 404 afterwards', async () => {
    const created = await request(app)
      .post('/api/ofertas')
      .set('Authorization', `Bearer ${token}`)
      .send(makeOferta())
      .expect(201);
    const id = created.body.data._id || created.body.data.id;

    const del = await request(app)
      .delete(`/api/ofertas/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);

    const notFound = await request(app).get(`/api/ofertas/${id}`);
    expect(notFound.status).toBe(404);
  });
});
