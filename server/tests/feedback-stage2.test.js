import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Feedback } from '../src/modules/feedback/feedback.model.js';

describe('Feedback Stage 2: Search, Filters, Sorting, Pagination, Status Update', () => {
  const app = createApp();
  let token, workspace;

  beforeEach(async () => {
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Stage 2 Tester',
      email: `tester-${Date.now()}@loop.test`,
      password: 'password123',
      workspaceName: 'Filter Workspace'
    });
    token = regRes.body.data.token;
    workspace = regRes.body.data.workspace;

    // Seed 4 distinct feedback records in this user's workspace
    await Feedback.create([
      {
        workspaceId: workspace._id,
        customerName: 'Alice Johnson',
        customerEmail: 'alice@alpha.com',
        message: 'The billing page produces an error when updating payment card details.',
        source: 'SUPPORT_TICKET',
        status: 'NEW',
        receivedAt: new Date('2026-01-10T10:00:00Z'),
        ai: {
          sentiment: 'NEGATIVE',
          category: 'BUG',
          summary: 'Billing payment update error',
          status: 'DONE'
        }
      },
      {
        workspaceId: workspace._id,
        customerName: 'Bob Smith',
        customerEmail: 'bob@beta.com',
        message: 'Love the new dark mode and the fast dashboard analytics!',
        source: 'APP_REVIEW',
        status: 'RESOLVED',
        receivedAt: new Date('2026-01-15T10:00:00Z'),
        ai: {
          sentiment: 'POSITIVE',
          category: 'PRAISE',
          summary: 'Enjoys dark mode and fast analytics',
          status: 'DONE'
        }
      },
      {
        workspaceId: workspace._id,
        customerName: 'Carol Davis',
        customerEmail: 'carol@gamma.com',
        message: 'Can we have CSV export for all feedback records?',
        source: 'SURVEY',
        status: 'IN_REVIEW',
        receivedAt: new Date('2026-01-20T10:00:00Z'),
        ai: {
          sentiment: 'NEUTRAL',
          category: 'FEATURE_REQUEST',
          summary: 'Request for CSV export feature',
          status: 'DONE'
        }
      },
      {
        workspaceId: workspace._id,
        customerName: 'David Lee',
        customerEmail: 'david@delta.com',
        message: 'Customer support agent answered within 2 minutes. Exceptional service.',
        source: 'SALES_NOTE',
        status: 'NEW',
        receivedAt: new Date('2026-01-25T10:00:00Z'),
        ai: {
          sentiment: 'POSITIVE',
          category: 'CUSTOMER_SUPPORT',
          summary: 'Fast support response praise',
          status: 'DONE'
        }
      }
    ]);
  });

  it('should search by keyword matching message text', async () => {
    const res = await request(app)
      .get('/api/feedback?q=billing')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].customerName).toBe('Alice Johnson');
  });

  it('should search by keyword matching customer name', async () => {
    const res = await request(app)
      .get('/api/feedback?q=Carol')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].message).toContain('CSV export');
  });

  it('should filter by sentiment', async () => {
    const res = await request(app)
      .get('/api/feedback?sentiment=POSITIVE')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(2);
    res.body.data.items.forEach(item => {
      expect(item.ai.sentiment).toBe('POSITIVE');
    });
  });

  it('should filter by category', async () => {
    const res = await request(app)
      .get('/api/feedback?category=BUG')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].ai.category).toBe('BUG');
  });

  it('should filter by status', async () => {
    const res = await request(app)
      .get('/api/feedback?status=NEW')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(2);
  });

  it('should sort items by receivedAt descending by default', async () => {
    const res = await request(app)
      .get('/api/feedback?sort=-receivedAt')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items[0].customerName).toBe('David Lee'); // Jan 25
    expect(res.body.data.items[3].customerName).toBe('Alice Johnson'); // Jan 10
  });

  it('should sort items by receivedAt ascending', async () => {
    const res = await request(app)
      .get('/api/feedback?sort=receivedAt')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items[0].customerName).toBe('Alice Johnson'); // Jan 10
    expect(res.body.data.items[3].customerName).toBe('David Lee'); // Jan 25
  });

  it('should update feedback status via PATCH /api/feedback/:id', async () => {
    const listRes = await request(app)
      .get('/api/feedback?limit=1')
      .set('Authorization', `Bearer ${token}`);

    const item = listRes.body.data.items[0];

    const patchRes = await request(app)
      .patch(`/api/feedback/${item._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'RESOLVED' });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.success).toBe(true);
    expect(patchRes.body.data.status).toBe('RESOLVED');

    // Verify in DB
    const verifyRes = await request(app)
      .get(`/api/feedback/${item._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(verifyRes.body.data.status).toBe('RESOLVED');
  });

  it('should reject invalid status with validation error', async () => {
    const listRes = await request(app)
      .get('/api/feedback?limit=1')
      .set('Authorization', `Bearer ${token}`);

    const item = listRes.body.data.items[0];

    const patchRes = await request(app)
      .patch(`/api/feedback/${item._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'INVALID_STATUS' });

    expect(patchRes.status).toBe(400);
    expect(patchRes.body.success).toBe(false);
    expect(patchRes.body.error.code).toBe('VALIDATION_ERROR');
  });
});
