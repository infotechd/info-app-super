import request from 'supertest';
import app from '../../app';

/**
 * Performance tests: ensure basic endpoints respond within 500ms.
 * Target per guidelines: API basic endpoints < 500ms.
 */

describe('API Performance - response time targets', () => {
  const TARGET_MS = 500; // as defined in guidelines

  it('GET / should respond within target', async () => {
    const start = process.hrtime.bigint();
    const res = await request(app).get('/');
    const end = process.hrtime.bigint();
    const elapsedMs = Number(end - start) / 1_000_000; // ns -> ms

    expect(res.status).toBe(200);
    expect(elapsedMs).toBeLessThanOrEqual(TARGET_MS);
  });

  it('GET /api/health should respond within target', async () => {
    const start = process.hrtime.bigint();
    const res = await request(app).get('/api/health');
    const end = process.hrtime.bigint();
    const elapsedMs = Number(end - start) / 1_000_000; // ns -> ms

    expect(res.status).toBe(200);
    expect(elapsedMs).toBeLessThanOrEqual(TARGET_MS);
  });
});
