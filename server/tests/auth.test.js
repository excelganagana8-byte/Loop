import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Auth API (Stage 3)', () => {
  const app = createApp();

  it('should successfully register a new user and create an initial workspace with OWNER role', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Elena Rostova',
        email: 'elena@acme.corp',
        password: 'securePassword123!',
        workspaceName: 'Acme Intelligence'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe('elena@acme.corp');
    expect(res.body.data.workspace.name).toBe('Acme Intelligence');
    expect(res.body.data.role).toBe('OWNER');
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
  });

  it('should reject registration when email already exists', async () => {
    const payload = {
      name: 'Duplicate Test',
      email: 'duplicate@test.com',
      password: 'password123'
    };

    // First registration
    const firstRes = await request(app)
      .post('/api/auth/register')
      .send(payload);
    expect(firstRes.status).toBe(201);

    // Second registration with same email
    const secondRes = await request(app)
      .post('/api/auth/register')
      .send(payload);

    expect(secondRes.status).toBe(400);
    expect(secondRes.body.success).toBe(false);
    expect(secondRes.body.error.code).toBe('EMAIL_EXISTS');
  });

  it('should login with valid credentials and return JWT token', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Login User',
        email: 'login@test.com',
        password: 'validPassword123'
      });
    expect(regRes.status).toBe(201);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@test.com',
        password: 'validPassword123'
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data).toHaveProperty('token');
    expect(loginRes.body.data.user.email).toBe('login@test.com');
    expect(loginRes.body.data.role).toBe('OWNER');
  });

  it('should reject login with wrong password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Wrong Pass User',
        email: 'wrongpass@test.com',
        password: 'correctPassword'
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'wrongpass@test.com',
        password: 'wrongPassword'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should return current user, workspace and role on GET /api/auth/me with valid token', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Me User',
        email: 'me@test.com',
        password: 'password123',
        workspaceName: 'Me Workspace'
      });

    const token = regRes.body.data.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.user.email).toBe('me@test.com');
    expect(meRes.body.data.workspace.name).toBe('Me Workspace');
    expect(meRes.body.data.role).toBe('OWNER');
  });

  it('should reject GET /api/auth/me without authorization header', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
