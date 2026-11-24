import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Stage 3 Multi-tenancy: Workspace Isolation & RBAC', () => {
  const app = createApp();

  let tokenA, workspaceA, userA;
  let tokenB, workspaceB, userB;
  let tokenMember, memberUser;
  let feedbackAId, feedbackBId;

  beforeEach(async () => {
    // 1. Register User A in Workspace A
    const resA = await request(app).post('/api/auth/register').send({
      name: 'Alice Founder',
      email: 'alice@company-a.com',
      password: 'password123',
      workspaceName: 'Company Alpha'
    });
    tokenA = resA.body.data.token;
    workspaceA = resA.body.data.workspace;
    userA = resA.body.data.user;

    // 2. Register User B in Workspace B
    const resB = await request(app).post('/api/auth/register').send({
      name: 'Bob Competitor',
      email: 'bob@company-b.com',
      password: 'password123',
      workspaceName: 'Company Beta'
    });
    tokenB = resB.body.data.token;
    workspaceB = resB.body.data.workspace;
    userB = resB.body.data.user;

    // 3. User A creates Feedback A in Workspace A
    const fbARes = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        customerName: 'Customer of A',
        customerEmail: 'custA@example.com',
        message: 'Top secret proprietary feedback regarding Alpha pricing.',
        source: 'SUPPORT_TICKET'
      });
    feedbackAId = fbARes.body.data._id;

    // 4. User B creates Feedback B in Workspace B
    const fbBRes = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        customerName: 'Customer of B',
        customerEmail: 'custB@example.com',
        message: 'Feedback for Beta platform.',
        source: 'APP_REVIEW'
      });
    feedbackBId = fbBRes.body.data._id;

    // 5. User A invites Member C to Workspace A with MEMBER role
    const inviteRes = await request(app)
      .post(`/api/workspaces/${workspaceA._id}/members/invite`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        email: 'charlie.member@company-a.com',
        role: 'MEMBER'
      });

    // Login as Charlie Member (default initial password 'loop123456')
    const loginMemberRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'charlie.member@company-a.com',
        password: 'loop123456'
      });
    tokenMember = loginMemberRes.body.data.token;
    memberUser = loginMemberRes.body.data.user;
  });

  it('Workspace B should only list items belonging to Workspace B (never Workspace A)', async () => {
    const res = await request(app)
      .get('/api/feedback')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0]._id).toBe(feedbackBId);
    expect(res.body.data.items[0].customerName).toBe('Customer of B');

    // Ensure feedback A is completely absent
    const containsFeedbackA = res.body.data.items.some(it => it._id === feedbackAId);
    expect(containsFeedbackA).toBe(false);
  });

  it('Cross-workspace read MUST return 404 (not 403) to prevent leaking existence', async () => {
    // User B attempts to read User A's feedback
    const res = await request(app)
      .get(`/api/feedback/${feedbackAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('Cross-workspace PATCH status MUST return 404', async () => {
    // User B attempts to modify status of User A's feedback
    const res = await request(app)
      .patch(`/api/feedback/${feedbackAId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ status: 'RESOLVED' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('Cross-workspace DELETE MUST return 404', async () => {
    // User B attempts to delete User A's feedback
    const res = await request(app)
      .delete(`/api/feedback/${feedbackAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('MEMBER role can submit feedback and update status', async () => {
    // Submit feedback
    const createRes = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${tokenMember}`)
      .send({
        customerName: 'Charlie Customer',
        message: 'Message from Member role.',
        source: 'SURVEY'
      });

    expect(createRes.status).toBe(201);
    const newId = createRes.body.data._id;

    // Update status
    const patchRes = await request(app)
      .patch(`/api/feedback/${newId}`)
      .set('Authorization', `Bearer ${tokenMember}`)
      .send({ status: 'IN_REVIEW' });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.status).toBe('IN_REVIEW');
  });

  it('MEMBER role CANNOT delete feedback (server returns 403 Forbidden)', async () => {
    const res = await request(app)
      .delete(`/api/feedback/${feedbackAId}`)
      .set('Authorization', `Bearer ${tokenMember}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('OWNER role CAN delete feedback (server returns 200 OK)', async () => {
    const res = await request(app)
      .delete(`/api/feedback/${feedbackAId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.deleted).toBe(true);

    // Verify item is gone
    const verifyRes = await request(app)
      .get(`/api/feedback/${feedbackAId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(verifyRes.status).toBe(404);
  });
});
