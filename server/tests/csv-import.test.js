import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Feedback } from '../src/modules/feedback/feedback.model.js';

describe('CSV Import API (Stage 6)', () => {
  const app = createApp();
  let token, workspace;

  beforeEach(async () => {
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'CSV Tester',
      email: `csv-${Date.now()}@test.com`,
      password: 'password123',
      workspaceName: 'CSV Workspace'
    });
    token = regRes.body.data.token;
    workspace = regRes.body.data.workspace;
  });

  it('should import a valid CSV and populate workspace feedback', async () => {
    const csvContent = `customerName,customerEmail,message,source,receivedAt
Michael Scott,michael@dundermifflin.com,The new paper delivery portal is wonderful,APP_REVIEW,2026-01-01
Dwight Schrute,dwight@dundermifflin.com,Security issue: beet farm password reset bypass,SUPPORT_TICKET,2026-01-02`;

    const res = await request(app)
      .post('/api/feedback/import')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from(csvContent, 'utf-8'), 'feedback.csv');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.imported).toBe(2);
    expect(res.body.data.rejected).toHaveLength(0);

    // Verify in database
    const inDb = await Feedback.find({ workspaceId: workspace._id });
    expect(inDb).toHaveLength(2);
  });

  it('should handle partial success and detail rejected rows with specific error reasons', async () => {
    const csvContent = `customerName,customerEmail,message,source
Valid User,valid@test.com,Legitimate feedback message,SURVEY
,missingname@test.com,Message with missing name,APP_REVIEW
Valid Name,,Message without email is valid,SALES_NOTE
Bad Email,invalid-email-address,Message with malformed email,SUPPORT_TICKET
User With No Message,nomessage@test.com,,OTHER`;

    const res = await request(app)
      .post('/api/feedback/import')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from(csvContent, 'utf-8'), 'mixed.csv');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Rows 1 and 3 are valid -> 2 imported
    expect(res.body.data.imported).toBe(2);

    // Rows 2, 4, 5 are rejected -> 3 rejected
    expect(res.body.data.rejected).toHaveLength(3);

    const reasons = res.body.data.rejected.map(r => r.reason.toLowerCase());
    expect(reasons.some(r => r.includes('name'))).toBe(true);
    expect(reasons.some(r => r.includes('email'))).toBe(true);
    expect(reasons.some(r => r.includes('message'))).toBe(true);
  });

  it('should reject request when no file is uploaded', async () => {
    const res = await request(app)
      .post('/api/feedback/import')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
