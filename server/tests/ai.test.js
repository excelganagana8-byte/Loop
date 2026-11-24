import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Feedback } from '../src/modules/feedback/feedback.model.js';
import { aiAnalysisOutputSchema } from '../src/modules/ai/ai.validators.js';
import { analyzeFeedbackItem } from '../src/modules/ai/ai.service.js';

describe('AI Module (Stage 4)', () => {
  const app = createApp();
  let token, workspace;

  beforeEach(async () => {
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'AI Tester',
      email: `ai-tester-${Date.now()}@loop.test`,
      password: 'password123',
      workspaceName: 'AI Workspace'
    });
    token = regRes.body.data.token;
    workspace = regRes.body.data.workspace;
  });

  it('should validate structured AI tool output with Zod schema', () => {
    const validOutput = {
      sentiment: 'NEGATIVE',
      category: 'BUG',
      summary: 'Page crashes during checkout flow',
      keyPhrases: ['checkout crash', 'payment gateway'],
      confidence: 0.92
    };

    const parsed = aiAnalysisOutputSchema.safeParse(validOutput);
    expect(parsed.success).toBe(true);
    expect(parsed.data.sentiment).toBe('NEGATIVE');
    expect(parsed.data.category).toBe('BUG');

    const invalidOutput = {
      sentiment: 'SUPER_ANGRY', // Invalid enum
      category: 'SOMETHING_ELSE'
    };
    const invalidParsed = aiAnalysisOutputSchema.safeParse(invalidOutput);
    expect(invalidParsed.success).toBe(false);
  });

  it('Fallback path: marks ai.status as FAILED when API is unavailable without faking results', async () => {
    const feedback = await Feedback.create({
      workspaceId: workspace._id,
      customerName: 'No API Customer',
      message: 'Great service overall, but dark mode would be nice.',
      source: 'APP_REVIEW',
      status: 'NEW',
      ai: { status: 'PENDING' }
    });

    // Pass null client to simulate missing API key
    const updated = await analyzeFeedbackItem(feedback._id, workspace._id, null);

    expect(updated).not.toBeNull();
    expect(updated.ai.status).toBe('FAILED');
    expect(updated.ai.sentiment).toBe('UNKNOWN');
    expect(updated.ai.confidence).toBe(0);
    // Feedback remains intact and usable
    expect(updated.message).toBe('Great service overall, but dark mode would be nice.');
  });

  it('Successfully applies structured classification when model returns tool use', async () => {
    const feedback = await Feedback.create({
      workspaceId: workspace._id,
      customerName: 'John Doe',
      message: 'The billing page keeps giving a 500 error when clicking submit.',
      source: 'SUPPORT_TICKET',
      status: 'NEW',
      ai: { status: 'PENDING' }
    });

    // Mock Anthropic client returning valid tool use block
    const mockAnthropic = {
      messages: {
        create: async () => ({
          content: [
            {
              type: 'tool_use',
              name: 'classify_customer_feedback',
              input: {
                sentiment: 'NEGATIVE',
                category: 'BUG',
                summary: '500 server error encountered on billing page submission',
                keyPhrases: ['billing page', '500 error', 'submit button'],
                confidence: 0.96
              }
            }
          ]
        })
      }
    };

    const updated = await analyzeFeedbackItem(feedback._id, workspace._id, mockAnthropic);

    expect(updated.ai.status).toBe('DONE');
    expect(updated.ai.sentiment).toBe('NEGATIVE');
    expect(updated.ai.category).toBe('BUG');
    expect(updated.ai.summary).toContain('500 server error');
    expect(updated.ai.keyPhrases).toContain('billing page');
    expect(updated.ai.confidence).toBe(0.96);
  });

  it('POST /api/feedback/:id/analyze endpoint triggers re-analysis', async () => {
    const feedback = await Feedback.create({
      workspaceId: workspace._id,
      customerName: 'Alice Reanalyze',
      message: 'Feature request for slack integration',
      source: 'SURVEY',
      status: 'NEW',
      ai: { status: 'PENDING' }
    });

    const res = await request(app)
      .post(`/api/feedback/${feedback._id}/analyze`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(feedback._id.toString());
    // Since env API key is not provided in test, fallback sets FAILED
    expect(res.body.data.ai.status).toBe('FAILED');
  });

  it('POST /api/ai/analyze-batch endpoint processes batch of unanalyzed feedback items', async () => {
    // Create 3 unanalyzed items
    await Feedback.create([
      {
        workspaceId: workspace._id,
        customerName: 'User 1',
        message: 'Feedback 1',
        source: 'OTHER',
        ai: { status: 'PENDING' }
      },
      {
        workspaceId: workspace._id,
        customerName: 'User 2',
        message: 'Feedback 2',
        source: 'OTHER',
        ai: { status: 'PENDING' }
      }
    ]);

    const res = await request(app)
      .post('/api/ai/analyze-batch')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.processedIds).toHaveLength(2);
  });
});
