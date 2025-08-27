import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { connectInMemoryMongo, disconnectInMemoryMongo, clearDatabase } from './utils/testDb';

describe('P0 - Auth flow', () => {
  beforeAll(async () => {
    await connectInMemoryMongo();
  });
  afterAll(async () => {
    await disconnectInMemoryMongo();
  });
  beforeEach(async () => {
    await clearDatabase();
  });

  it('should register a new user (201) and return token + user', async () => {
    const payload = {
      nome: 'Teste',
      email: 'teste@example.com',
      senha: 'Senha@123',
      tipo: 'provider'
    };
    const res = await request(app).post('/api/auth/register').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.token).toBeDefined();
    expect(res.body.data?.user?.email).toBe(payload.email);
  });

  it('should not allow registering with duplicate email (400)', async () => {
    const payload = { nome: 'Aa', email: 'dup@example.com', senha: 'Senha@123', tipo: 'provider' };
    await request(app).post('/api/auth/register').send(payload).expect(201);
    const res = await request(app).post('/api/auth/register').send(payload);
    expect(res.status).toBe(400); // controller returns 400 for duplicate
    expect(res.body.success).toBe(false);
  });

  it('should login with valid credentials (200)', async () => {
    const email = 'login@example.com';
    const senha = 'Senha@123';
    await request(app).post('/api/auth/register').send({ nome: 'Xx', email, senha, tipo: 'prestador' }).expect(201);
    const res = await request(app).post('/api/auth/login').send({ email, senha });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.token).toBeDefined();
  });

  it('should return 400 for invalid credentials', async () => {
    const email = 'invalid@example.com';
    await request(app).post('/api/auth/register').send({ nome: 'Yy', email, senha: 'Senha@123', tipo: 'provider' }).expect(201);
    const res = await request(app).post('/api/auth/login').send({ email, senha: 'wrong' });
    expect(res.status).toBe(400); // controller uses 400 for invalid creds
    expect(res.body.success).toBe(false);
  });

  it('should protect /profile: 401 without token, 200 with token', async () => {
    await request(app).get('/api/auth/profile').expect(401);

    const reg = await request(app)
      .post('/api/auth/register')
      .send({ nome: 'Zz', email: 'z@example.com', senha: 'Senha@123', tipo: 'provider' })
      .expect(201);
    const token = reg.body.data.token as string;

    const res = await request(app).get('/api/auth/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.user?.email).toBe('z@example.com');
  });
});
