import request from 'supertest';
import app from '../app';
import { connectInMemoryMongo, disconnectInMemoryMongo, clearDatabase } from './utils/testDb';

const providerPayload = { nome: 'Uploader', email: 'uploader@example.com', senha: 'Senha@123', tipo: 'provider' as const };

function makeBuffer(len = 10, fill = 0xff) {
  return Buffer.alloc(len, fill);
}

describe('P0 - Uploads (GridFS) fluxo principal', () => {
  let token: string;

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
  });

  it('POST /api/upload/files requires auth (401)', async () => {
    await request(app)
      .post('/api/upload/files')
      .attach('files', makeBuffer(16), { filename: 'img.jpg', contentType: 'image/jpeg' })
      .expect(401);
  });

  it('POST /api/upload/files should accept valid image and return 201 with fileId; GET file should stream (200)', async () => {
    const uploadRes = await request(app)
      .post('/api/upload/files')
      .set('Authorization', `Bearer ${token}`)
      .field('categoria', 'test')
      .field('descricao', 'arquivo de teste')
      .attach('files', makeBuffer(1024), { filename: 'img.jpg', contentType: 'image/jpeg' });

    expect(uploadRes.status).toBe(201);
    expect(uploadRes.body.success).toBe(true);
    const files = uploadRes.body.data?.files;
    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBeGreaterThanOrEqual(1);

    const fileId = files[0].fileId as string;
    expect(typeof fileId).toBe('string');

    const getRes = await request(app).get(`/api/upload/file/${fileId}`);
    expect([200, 206]).toContain(getRes.status); // may be 200 or 206 depending on env
    // Content-Type should be image/jpeg
    const ctype = getRes.headers['content-type'];
    expect(ctype).toBeDefined();
    expect(ctype).toContain('image/jpeg');
  });

  it('POST /api/upload/files should reject invalid type (400 no files accepted)', async () => {
    const res = await request(app)
      .post('/api/upload/files')
      .set('Authorization', `Bearer ${token}`)
      .attach('files', makeBuffer(32), { filename: 'note.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/nenhum arquivo/i);
  });

  it('GET /api/upload/file/:id returns 404 for non-existent file', async () => {
    const nonId = 'aaaaaaaaaaaaaaaaaaaaaaaa'; // 24 hex chars -> valid ObjectId-like
    const res = await request(app).get(`/api/upload/file/${nonId}`);
    expect(res.status).toBe(404);
  });

  it('GET /api/upload/my-files requires auth (401)', async () => {
    await request(app).get('/api/upload/my-files').expect(401);
  });
});
