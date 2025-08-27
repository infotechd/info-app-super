import request from 'supertest';
import app from '../app';
import { connectInMemoryMongo, disconnectInMemoryMongo, clearDatabase } from './utils/testDb';

const provider = { nome: 'Uploader P1', email: 'uploaderp1@example.com', senha: 'Senha@123', tipo: 'provider' as const };

function makeBuffer(len = 1024, fill = 0xaa) {
  return Buffer.alloc(len, fill);
}

// Craft a minimal buffer that contains an 'mvhd' box-like sequence so getMp4DurationSeconds() can parse duration
function makeFakeMp4WithDuration(seconds: number): Buffer {
  const prefix = Buffer.alloc(16, 0); // arbitrary leading bytes
  const mvhd = Buffer.from('mvhd');
  const after = Buffer.alloc(32, 0);
  // Layout based on uploadController.getMp4DurationSeconds for version 0
  // start = mvhdIndex + 4
  // [start+0] version (0)
  after.writeUInt8(0, 0);
  // [start+1..+3] flags = 0
  // [start+4..+7] ctime = 0
  // [start+8..+11] mtime = 0
  // [start+12..+15] timescale (set 1)
  after.writeUInt32BE(1, 12);
  // [start+16..+19] duration
  after.writeUInt32BE(seconds, 16);
  return Buffer.concat([prefix, mvhd, after]);
}

describe('P1 - Uploads: cenários realistas (paginação, metadados, rejeição de vídeos longos)', () => {
  let token: string;

  beforeAll(async () => {
    await connectInMemoryMongo();
  });
  afterAll(async () => {
    await disconnectInMemoryMongo();
  });
  beforeEach(async () => {
    await clearDatabase();
    const reg = await request(app).post('/api/auth/register').send(provider).expect(201);
    token = reg.body.data.token as string;
  });

  it('should ignore MP4 > 15s but upload valid images; message should mention ignored video', async () => {
    const longVideo = makeFakeMp4WithDuration(20);
    const res = await request(app)
      .post('/api/upload/files')
      .set('Authorization', `Bearer ${token}`)
      .attach('files', makeBuffer(2048), { filename: 'a.jpg', contentType: 'image/jpeg' })
      .attach('files', makeBuffer(2048), { filename: 'b.png', contentType: 'image/png' })
      .attach('files', longVideo, { filename: 'video.mp4', contentType: 'video/mp4' })
      .field('categoria', 'teste')
      .field('descricao', 'mix com vídeo longo');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/ignorados/i);
    expect(res.body.message).toMatch(/video\.mp4/i);
    const files = res.body.data?.files;
    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBe(2); // only images accepted
  });

  it('should paginate user files and provide totals; get info and delete flow', async () => {
    // Upload 3 images
    const upload1 = await request(app)
      .post('/api/upload/files')
      .set('Authorization', `Bearer ${token}`)
      .attach('files', makeBuffer(2048), { filename: '1.jpg', contentType: 'image/jpeg' })
      .expect(201);
    const upload2 = await request(app)
      .post('/api/upload/files')
      .set('Authorization', `Bearer ${token}`)
      .attach('files', makeBuffer(2048), { filename: '2.jpg', contentType: 'image/jpeg' })
      .expect(201);
    const upload3 = await request(app)
      .post('/api/upload/files')
      .set('Authorization', `Bearer ${token}`)
      .attach('files', makeBuffer(2048), { filename: '3.jpg', contentType: 'image/jpeg' })
      .expect(201);

    const ids = [upload1, upload2, upload3].flatMap(r => (r.body.data?.files || []).map((f: any) => f.fileId));
    expect(ids.length).toBe(3);

    // Page 1, limit 2
    const page1 = await request(app).get('/api/upload/my-files').set('Authorization', `Bearer ${token}`).query({ page: 1, limit: 2 });
    expect(page1.status).toBe(200);
    expect(page1.body.success).toBe(true);
    expect(page1.body.data.pagination.page).toBe(1);
    expect(page1.body.data.pagination.limit).toBe(2);
    expect(page1.body.data.pagination.total).toBe(3);
    expect(page1.body.data.pagination.totalPages).toBe(2);
    expect(page1.body.data.files.length).toBe(2);

    // Page 2
    const page2 = await request(app).get('/api/upload/my-files').set('Authorization', `Bearer ${token}`).query({ page: 2, limit: 2 });
    expect(page2.status).toBe(200);
    expect(page2.body.data.files.length).toBe(1);

    // Get info for one file
    const someId = ids[0];
    const info = await request(app).get(`/api/upload/info/${someId}`).set('Authorization', `Bearer ${token}`);
    expect(info.status).toBe(200);
    expect(info.body.success).toBe(true);
    expect(info.body.data.fileId).toBeDefined();

    // Delete that file
    const del = await request(app).delete(`/api/upload/file/${someId}`).set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);

    // Then download should be 404
    const dl = await request(app).get(`/api/upload/file/${someId}`);
    expect(dl.status).toBe(404);
  });
});
