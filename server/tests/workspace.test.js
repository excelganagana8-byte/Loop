import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Workspace & Team Management API (Stage 8)', () => {
  const app = createApp();
  let ownerToken, workspace, ownerUser;
  let memberToken, memberUser;

  beforeEach(async () => {
    // 1. Register Owner
    const regOwner = await request(app).post('/api/auth/register').send({
      name: 'Owner User',
      email: `owner-${Date.now()}@workspace.test`,
      password: 'password123',
      workspaceName: 'Acme Test Corp'
    });
    ownerToken = regOwner.body.data.token;
    workspace = regOwner.body.data.workspace;
    ownerUser = regOwner.body.data.user;

    // 2. Invite a member
    const inviteRes = await request(app)
      .post(`/api/workspaces/${workspace._id}/members/invite`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        email: `member-${Date.now()}@workspace.test`,
        role: 'MEMBER'
      });
    memberUser = inviteRes.body.data;

    // Login as the member
    const memberLogin = await request(app).post('/api/auth/login').send({
      email: memberUser.email,
      password: 'loop123456'
    });
    memberToken = memberLogin.body.data.token;
  });

  it('GET /api/workspaces/:id/members lists all workspace members', async () => {
    const res = await request(app)
      .get(`/api/workspaces/${workspace._id}/members`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });

  it('PATCH /api/workspaces/:id/members/:userId allows OWNER to promote member to ADMIN', async () => {
    const res = await request(app)
      .patch(`/api/workspaces/${workspace._id}/members/${memberUser.userId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ role: 'ADMIN' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('ADMIN');
  });

  it('MEMBER role is rejected when attempting to invite colleagues (403 Forbidden)', async () => {
    const res = await request(app)
      .post(`/api/workspaces/${workspace._id}/members/invite`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        email: 'outsider@test.com',
        role: 'MEMBER'
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('PATCH /api/workspaces/:id updates workspace name', async () => {
    const res = await request(app)
      .patch(`/api/workspaces/${workspace._id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Acme Enterprise Solutions' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Acme Enterprise Solutions');
  });

  it('DELETE /api/workspaces/:id/members/:userId removes a member', async () => {
    const res = await request(app)
      .delete(`/api/workspaces/${workspace._id}/members/${memberUser.userId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify member count decreased
    const verifyRes = await request(app)
      .get(`/api/workspaces/${workspace._id}/members`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(verifyRes.body.data).toHaveLength(1);
  });
});
