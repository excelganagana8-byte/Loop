import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Feedback } from '../src/modules/feedback/feedback.model.js';

describe('Analytics API (Stage 5 Real Aggregation)', () => {
  const app = createApp();
  let tokenA, workspaceA;
  let tokenB, workspaceB;

  beforeEach(async () => {
    // 1. Setup Workspace A
    const resA = await request(app).post('/api/auth/register').send({
      name: 'Analytics User A',
      email: `analytics-a-${Date.now()}@test.com`,
      password: 'password123',
      workspaceName: 'Workspace A Analytics'
    });
    tokenA = resA.body.data.token;
    workspaceA = resA.body.data.workspace;

    // 2. Setup Workspace B
    const resB = await request(app).post('/api/auth/register').send({
      name: 'Analytics User B',
      email: `analytics-b-${Date.now()}@test.com`,
      password: 'password123',
      workspaceName: 'Workspace B Analytics'
    });
    tokenB = resB.body.data.token;
    workspaceB = resB.body.data.workspace;

    // 3. Seed real feedback in Workspace A
    await Feedback.create([
      {
        workspaceId: workspaceA._id,
        customerName: 'Customer 1',
        message: 'Broken login button on safari',
        source: 'SUPPORT_TICKET',
        status: 'RESOLVED',
        receivedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        ai: {
          sentiment: 'NEGATIVE',
          category: 'BUG',
          keyPhrases: ['safari login', 'broken button'],
          status: 'DONE'
        }
      },
      {
        workspaceId: workspaceA._id,
        customerName: 'Customer 2',
        message: 'Amazing reporting speeds, best tool ever!',
        source: 'APP_REVIEW',
        status: 'NEW',
        receivedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        ai: {
          sentiment: 'POSITIVE',
          category: 'PRAISE',
          keyPhrases: ['reporting speed', 'best tool'],
          status: 'DONE'
        }
      },
      {
        workspaceId: workspaceA._id,
        customerName: 'Customer 3',
        message: 'Another bug on export screen',
        source: 'SUPPORT_TICKET',
        status: 'IN_REVIEW',
        receivedAt: new Date(),
        ai: {
          sentiment: 'NEGATIVE',
          category: 'BUG',
          keyPhrases: ['export screen', 'broken button'],
          status: 'DONE'
        }
      }
    ]);

    // 4. Seed 1 feedback item in Workspace B (to prove strict workspace aggregation isolation)
    await Feedback.create({
      workspaceId: workspaceB._id,
      customerName: 'Competitor Customer',
      message: 'Workspace B specific message',
      source: 'SURVEY',
      status: 'NEW',
      ai: { sentiment: 'NEUTRAL', category: 'OTHER', status: 'DONE' }
    });
  });

  it('GET /api/analytics/summary returns correct aggregated numbers scoped to workspace', async () => {
    const res = await request(app)
      .get('/api/analytics/summary')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const summary = res.body.data;
    // Exactly 3 items in Workspace A (Workspace B's item is not counted)
    expect(summary.total).toBe(3);
    expect(summary.sentimentCounts.POSITIVE).toBe(1);
    expect(summary.sentimentCounts.NEGATIVE).toBe(2);
    expect(summary.sentimentCounts.NEUTRAL).toBe(0);
    // 1 out of 3 resolved = 33%
    expect(summary.resolutionRate).toBe(33);
  });

  it('GET /api/analytics/distribution returns real counts and percentages', async () => {
    const res = await request(app)
      .get('/api/analytics/distribution?by=sentiment&range=30d')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBe(3);

    const negativeGroup = res.body.data.data.find(d => d.name === 'NEGATIVE');
    expect(negativeGroup).toBeDefined();
    expect(negativeGroup.count).toBe(2);
    expect(negativeGroup.percentage).toBe(67);
  });

  it('GET /api/analytics/trends returns daily time series buckets', async () => {
    const res = await request(app)
      .get('/api/analytics/trends?range=30d')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('date');
    expect(res.body.data[0]).toHaveProperty('total');
    expect(res.body.data[0]).toHaveProperty('positive');
  });

  it('GET /api/analytics/top-issues aggregates top categories and key phrases', async () => {
    const res = await request(app)
      .get('/api/analytics/top-issues')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // BUG has count 2 in Workspace A
    const bugCategory = res.body.data.categories.find(c => c.category === 'BUG');
    expect(bugCategory).toBeDefined();
    expect(bugCategory.count).toBe(2);
    expect(bugCategory.sampleIds.length).toBeGreaterThan(0);

    // 'broken button' phrase appears in 2 items
    const phrase = res.body.data.keyPhrases.find(k => k.phrase === 'broken button');
    expect(phrase).toBeDefined();
    expect(phrase.count).toBe(2);
  });

  it('GET /api/analytics/recent returns 10 latest feedback items', async () => {
    const res = await request(app)
      .get('/api/analytics/recent')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(3);
    // Ordered descending by receivedAt
    expect(res.body.data[0].customerName).toBe('Customer 3');
  });
});
