import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Feedback } from '../src/modules/feedback/feedback.model.js';

describe('AI Insights API (Stage 6)', () => {
  const app = createApp();
  let token, workspace;

  beforeEach(async () => {
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Insights Tester',
      email: `insights-${Date.now()}@test.com`,
      password: 'password123',
      workspaceName: 'Insights Workspace'
    });
    token = regRes.body.data.token;
    workspace = regRes.body.data.workspace;

    // Seed feedback to produce grounded insights
    await Feedback.create([
      {
        workspaceId: workspace._id,
        customerName: 'Customer Alpha',
        message: 'Severe checkout lag and payment gateway timeout',
        source: 'SUPPORT_TICKET',
        status: 'NEW',
        ai: {
          sentiment: 'NEGATIVE',
          category: 'PERFORMANCE',
          keyPhrases: ['checkout lag', 'payment timeout'],
          status: 'DONE'
        }
      },
      {
        workspaceId: workspace._id,
        customerName: 'Customer Beta',
        message: 'Payment gateway timeout again during black friday',
        source: 'APP_REVIEW',
        status: 'IN_REVIEW',
        ai: {
          sentiment: 'NEGATIVE',
          category: 'PERFORMANCE',
          keyPhrases: ['payment timeout', 'black friday'],
          status: 'DONE'
        }
      },
      {
        workspaceId: workspace._id,
        customerName: 'Customer Gamma',
        message: 'Please add automated slack alert notifications',
        source: 'SURVEY',
        status: 'NEW',
        ai: {
          sentiment: 'NEUTRAL',
          category: 'FEATURE_REQUEST',
          keyPhrases: ['slack alerts'],
          status: 'DONE'
        }
      }
    ]);
  });

  it('POST /api/insights/generate generates grounded insights with real evidence count', async () => {
    const res = await request(app)
      .post('/api/insights/generate')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const firstInsight = res.body.data[0];
    expect(firstInsight).toHaveProperty('type');
    expect(firstInsight).toHaveProperty('title');
    expect(firstInsight).toHaveProperty('body');
    expect(firstInsight.evidence).toHaveProperty('count');
    expect(firstInsight.evidence.count).toBeGreaterThan(0);
    expect(firstInsight.evidence.feedbackIds.length).toBeGreaterThan(0);
  });

  it('GET /api/insights returns stored insights for caller workspace', async () => {
    // Generate first
    await request(app)
      .post('/api/insights/generate')
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .get('/api/insights')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].workspaceId.toString()).toBe(workspace._id.toString());
  });
});
