import request from 'supertest';
import app from '../app';

// This test ensures that when DB is not connected (e.g., SKIP_DB=true or no connection),
// the public download route responds gracefully with 503 instead of crashing.

describe('Upload download route without DB (SKIP_DB scenario)', () => {
  it('GET /api/upload/file/:id should return 503 when storage is unavailable', async () => {
    const validObjectId = '507f1f77bcf86cd799439011';
    const res = await request(app).get(`/api/upload/file/${validObjectId}`);

    // Should not crash; should return 503 with ApiResponse envelope
    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({ success: false });
    expect(typeof res.body.message).toBe('string');
  });
});
