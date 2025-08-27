import request from 'supertest';
import app from '../../app';

export const registerUser = async (
  overrides: Partial<{ nome: string; email: string; senha: string; telefone?: string; tipo: 'buyer'|'provider'|'advertiser'}> = {}
): Promise<{ res: any; token: string; user: any }> => {
  const payload = {
    nome: overrides.nome ?? 'Teste User',
    email: overrides.email ?? `user_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`,
    senha: overrides.senha ?? 'Senha@123',
    telefone: overrides.telefone,
    tipo: overrides.tipo ?? 'provider'
  };
  const res = await request(app).post('/api/auth/register').send(payload);
  return { res, token: res.body?.data?.token as string, user: res.body?.data?.user };
};

export const loginUser = async (email: string, senha: string): Promise<{ res: any; token: string; user: any }> => {
  const res = await request(app).post('/api/auth/login').send({ email, senha });
  return { res, token: res.body?.data?.token as string, user: res.body?.data?.user };
};
