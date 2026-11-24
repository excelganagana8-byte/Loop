import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Feedback } from '../src/modules/feedback/feedback.model.js';
import { askLoop } from '../src/modules/ask/ask.service.js';

describe('Ask LOOP Q&A API (Stage 7)', () => {
  const app = createApp();
  let tokenA, workspaceA;
  let tokenB, workspaceB;
  let feedbackAId;

  beforeEach(async () => {
    // 1. Setup Workspace A
    const resA = await request(app).post('/api/auth/register').send({
      name: 'Ask Tester A',
      email: `aska-${Date.now()}@test.com`,
      password: 'password123',
      workspaceName: 'Workspace A Ask'
    });
    tokenA = resA.body.data.token;
    workspaceA = resA.body.data.workspace;

    // 2. Setup Workspace B
    const resB = await request(app).post('/api/auth/register').send({
      name: 'Ask Tester B',
      email: `askb-${Date.now()}@test.com`,
      password: 'password123',
      workspaceName: 'Workspace B Ask'
    });
    tokenB = resB.body.data.token;
    workspaceB = resB.body.data.workspace;

    // 3. Seed feedback in Workspace A
    const fbA = await Feedback.create({
      workspaceId: workspaceA._id,
      customerName: 'Alice Customer',
      message: 'The billing receipt is missing tax breakdown line items.',
      source: 'SUPPORT_TICKET',
      status: 'NEW',
      ai: {
        sentiment: 'NEGATIVE',
        category: 'PRICING',
        keyPhrases: ['tax breakdown', 'billing receipt'],
        status: 'DONE'
      }
    });
    feedbackAId = fbA._id;
  });

  it('Empty workspace returns clear "not enough data" response', async () => {
    // Workspace B has 0 feedback items
    const res = await request(app)
      .post('/api/ask')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ question: 'What are customers saying about billing?' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.answer).toContain('not enough customer feedback data');
    expect(res.body.data.citations).toHaveLength(0);
    expect(res.body.data.grounded).toBe(true);
  });

  it('Rejects invalid or blank question with validation error', async () => {
    const res = await request(app)
      .post('/api/ask')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ question: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('Answers question grounded in workspace data with verified citations', async () => {
    const res = await request(app)
      .post('/api/ask')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ question: 'What issues exist with billing or tax receipts?' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('answer');
    expect(res.body.data).toHaveProperty('citations');
    expect(res.body.data.grounded).toBe(true);

    // Citations must be grounded in Workspace A data
    expect(res.body.data.citations.length).toBeGreaterThan(0);
    expect(res.body.data.citations[0].feedbackId.toString()).toBe(feedbackAId.toString());
    expect(res.body.data.citations[0].snippet).toContain('billing receipt');
  });

  it('Validates citations and groundedness with mock Claude tool execution', async () => {
    const mockClaudeClient = {
      messages: {
        create: async () => ({
          content: [
            {
              type: 'tool_use',
              name: 'submit_answer',
              input: {
                answer: 'Customers report that billing receipts lack tax line items, causing accounting reconciliation friction.',
                citedFeedbackIds: [feedbackAId.toString()],
                grounded: true
              }
            }
          ]
        })
      }
    };

    const result = await askLoop(
      workspaceA._id,
      'Are there any billing receipt problems?',
      mockClaudeClient
    );

    expect(result.grounded).toBe(true);
    expect(result.answer).toContain('billing receipts lack tax line items');
    expect(result.citations).toHaveLength(1);
    expect(result.citations[0].feedbackId.toString()).toBe(feedbackAId.toString());
  });
});
