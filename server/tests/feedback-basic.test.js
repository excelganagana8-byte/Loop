import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Feedback API (Stage 1 with Auth)', () => {
  const app = createApp();
  let token;

  beforeEach(async () => {
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Test Engineer',
      email: `engineer-${Date.now()}@loop.test`,
      password: 'password123',
      workspaceName: 'Dev Workspace'
    });
    token = regRes.body.data.token;
  });

  it('should successfully create a feedback item with valid data', async () => {
    const payload = {
      customerName: 'Sarah Connor',
      customerEmail: 'sarah@cyberdyne.io',
      message: 'The reporting dashboard takes over 10 seconds to load.',
      source: 'SUPPORT_TICKET'
    };

    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data.customerName).toBe('Sarah Connor');
    expect(res.body.data.message).toBe(payload.message);
    expect(res.body.data.source).toBe('SUPPORT_TICKET');
    expect(res.body.data.status).toBe('NEW');
    expect(res.body.data.ai.status).toBe('PENDING');
  });

  it('should reject feedback submission missing required fields (Zod validation)', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: '',
        message: ''
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toBeInstanceOf(Array);
  });

  it('should list feedback items with pagination', async () => {
    // Insert 2 items
    await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'Alice',
        message: 'Feature suggestion: Dark mode',
        source: 'APP_REVIEW'
      });
    await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'Bob',
        message: 'Great customer support!',
        source: 'SURVEY'
      });

    const res = await request(app)
      .get('/api/feedback?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.page).toBe(1);
    expect(res.body.data.totalPages).toBe(1);
  });

  it('should return 404 for non-existent feedback ID', async () => {
    const res = await request(app)
      .get('/api/feedback/664b38d39c0fef9a81234567')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
