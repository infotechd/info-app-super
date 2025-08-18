import request from 'supertest';
import app from '../app';

// Basic smoke tests for the Express app

describe('App routes smoke tests', () => {
  it('GET / should return service status', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: 'Super App Backend ativo',
    });
    expect(res.body.data).toBeDefined();
    expect(res.body.data.apiBase).toBe('/api');
  });

  it('GET /api/health should return API health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: 'Super App API funcionando!',
    });
    expect(res.body.data).toBeDefined();
    expect(typeof res.body.data.timestamp).toBe('string');
  });

  it('GET unknown route should return 404 with ApiResponse', async () => {
    const res = await request(app).get('/rota-inexistente');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Rota não encontrada');
    expect(typeof res.body.error).toBe('string');
    expect(res.body.error).toContain('Cannot GET');
  });
});
