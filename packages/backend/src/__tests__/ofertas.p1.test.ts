import request from 'supertest';
import app from '../app';
import { connectInMemoryMongo, disconnectInMemoryMongo, clearDatabase } from './utils/testDb';

const provider = { nome: 'Prov P1', email: 'provp1@example.com', senha: 'Senha@123', tipo: 'provider' as const };

const baseOferta = () => ({
  titulo: 'Serviço padrão',
  descricao: 'Descrição longa de serviço padrão para testes de filtros e paginação.',
  preco: 100,
  categoria: 'Tecnologia' as const,
  imagens: ['/api/upload/file/abc'],
  localizacao: { cidade: 'São Paulo', estado: 'SP', endereco: 'Rua A, 123' },
  tags: ['tag1', 'tag2']
});

describe('P1 - Ofertas: filtros, paginação, busca e validações avançadas', () => {
  let token: string;

  beforeAll(async () => {
    await connectInMemoryMongo();
  });
  afterAll(async () => {
    await disconnectInMemoryMongo();
  });
  beforeEach(async () => {
    await clearDatabase();
    const reg = await request(app).post('/api/auth/register').send(provider);
    token = reg.body.data.token as string;
  });

  const createOferta = async (override: Partial<ReturnType<typeof baseOferta>> = {}) => {
    const payload = { ...baseOferta(), ...override } as any;
    const res = await request(app)
      .post('/api/ofertas')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect([200, 201, 400]).toContain(res.status); // caller will assert specifics
    return res;
  };

  it('should paginate results with page and limit; include total and totalPages', async () => {
    // Create 12 ofertas
    const combos = [
      { categoria: 'Tecnologia', cidade: 'São Paulo', estado: 'SP', preco: 50 },
      { categoria: 'Tecnologia', cidade: 'Rio de Janeiro', estado: 'RJ', preco: 120 },
      { categoria: 'Beleza', cidade: 'São Paulo', estado: 'SP', preco: 80 },
      { categoria: 'Jardinagem', cidade: 'Belo Horizonte', estado: 'MG', preco: 200 },
      { categoria: 'Beleza', cidade: 'Rio de Janeiro', estado: 'RJ', preco: 300 },
      { categoria: 'Jardinagem', cidade: 'São Paulo', estado: 'SP', preco: 180 },
      { categoria: 'Consultoria', cidade: 'Curitiba', estado: 'PR', preco: 90 },
      { categoria: 'Construção', cidade: 'Porto Alegre', estado: 'RS', preco: 400 },
      { categoria: 'Tecnologia', cidade: 'Fortaleza', estado: 'CE', preco: 70 },
      { categoria: 'Limpeza', cidade: 'Salvador', estado: 'BA', preco: 110 },
      { categoria: 'Eventos', cidade: 'São Paulo', estado: 'SP', preco: 60 },
      { categoria: 'Transporte', cidade: 'Recife', estado: 'PE', preco: 130 }
    ] as const;

    for (const c of combos) {
      await createOferta({
        categoria: c.categoria as any,
        preco: c.preco,
        localizacao: { cidade: c.cidade, estado: c.estado, endereco: 'End' }
      }).then(r => expect(r.status).toBe(201));
    }

    const resPage1 = await request(app).get('/api/ofertas').query({ page: 1, limit: 5 });
    expect(resPage1.status).toBe(200);
    expect(resPage1.body.success).toBe(true);
    expect(resPage1.body.data.page).toBe(1);
    expect(resPage1.body.data.total).toBe(12);
    expect(resPage1.body.data.totalPages).toBe(3);
    expect(resPage1.body.data.ofertas.length).toBe(5);

    const resPage2 = await request(app).get('/api/ofertas').query({ page: 2, limit: 5 });
    expect(resPage2.status).toBe(200);
    expect(resPage2.body.data.page).toBe(2);
    expect(resPage2.body.data.ofertas.length).toBe(5);

    const resPage3 = await request(app).get('/api/ofertas').query({ page: 3, limit: 5 });
    expect(resPage3.status).toBe(200);
    expect(resPage3.body.data.page).toBe(3);
    expect(resPage3.body.data.ofertas.length).toBe(2);
  });

  it('should filter by categoria, cidade, estado and price range', async () => {
    await createOferta({ categoria: 'Tecnologia', localizacao: { cidade: 'São Paulo', estado: 'SP' as any, endereco: 'A' }, preco: 100 }).then(r => expect(r.status).toBe(201));
    await createOferta({ categoria: 'Beleza', localizacao: { cidade: 'Rio de Janeiro', estado: 'RJ' as any, endereco: 'B' }, preco: 300 }).then(r => expect(r.status).toBe(201));
    await createOferta({ categoria: 'Tecnologia', localizacao: { cidade: 'Rio de Janeiro', estado: 'RJ' as any, endereco: 'C' }, preco: 150 }).then(r => expect(r.status).toBe(201));

    const byCat = await request(app).get('/api/ofertas').query({ categoria: 'Tecnologia' });
    expect(byCat.status).toBe(200);
    expect(byCat.body.data.ofertas.every((o: any) => o.categoria === 'Tecnologia')).toBe(true);

    const byCidadeEstado = await request(app).get('/api/ofertas').query({ cidade: 'Rio de Janeiro', estado: 'RJ' });
    expect(byCidadeEstado.status).toBe(200);
    expect(byCidadeEstado.body.data.ofertas.every((o: any) => o.localizacao?.cidade === 'Rio de Janeiro' && o.localizacao?.estado === 'RJ')).toBe(true);

    const byPrice = await request(app).get('/api/ofertas').query({ precoMin: 120, precoMax: 200 });
    expect(byPrice.status).toBe(200);
    const precos = byPrice.body.data.ofertas.map((o: any) => o.preco);
    expect(precos.every((p: number) => p >= 120 && p <= 200)).toBe(true);
  });

  it('should search by titulo/descricao/tags (busca)', async () => {
    await createOferta({ titulo: 'Aula de Violão', descricao: 'Aprenda violão do zero', tags: ['musica', 'cordas'] }).then(r => expect(r.status).toBe(201));
    await createOferta({ titulo: 'Passeio com cães', descricao: 'Passeio diário', tags: ['pets'] }).then(r => expect(r.status).toBe(201));

    const byTitle = await request(app).get('/api/ofertas').query({ busca: 'viol' });
    expect(byTitle.status).toBe(200);
    expect(byTitle.body.data.ofertas.some((o: any) => /viol/i.test(o.titulo) || /viol/i.test(o.descricao) || (o.tags || []).some((t: string) => /viol/i.test(t)))).toBe(true);
  });

  it('should default order by createdAt desc (latest first)', async () => {
    const first = await createOferta({ titulo: 'Primeira' }).then(r => (expect(r.status).toBe(201), r));
    const second = await createOferta({ titulo: 'Segunda' }).then(r => (expect(r.status).toBe(201), r));

    const res = await request(app).get('/api/ofertas').query({ limit: 2 });
    expect(res.status).toBe(200);
    const titles = res.body.data.ofertas.map((o: any) => o.titulo);
    expect(titles[0]).toBe('Segunda');
    expect(titles[1]).toBe('Primeira');
  });

  it('should reject when imagens+videos exceed 3 (create)', async () => {
    const payload = {
      ...baseOferta(),
      imagens: ['/api/upload/file/1', '/api/upload/file/2'],
      videos: ['/api/upload/file/3', '/api/upload/file/4']
    } as any;
    const res = await request(app)
      .post('/api/ofertas')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(JSON.stringify(res.body)).toMatch(/Máximo de 3 mídias/);
  });

  it('should validate filters: estado length 2 and non-negative prices', async () => {
    const badEstado = await request(app).get('/api/ofertas').query({ estado: 'SPX' });
    expect(badEstado.status).toBe(400);
    expect(badEstado.body.success).toBe(false);

    const badPreco = await request(app).get('/api/ofertas').query({ precoMin: -1 });
    expect(badPreco.status).toBe(400);
    expect(badPreco.body.success).toBe(false);
  });
});
