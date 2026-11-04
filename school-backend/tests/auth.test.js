import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app, loginAs, prisma, request, resetDb, seedFixture } from './helpers.js';

let fx;
beforeAll(async () => {
  await resetDb();
  fx = await seedFixture();
});
afterAll(() => prisma.$disconnect());

describe('registration', () => {
  it.each(['ADMIN', 'TEACHER'])('rejects public sign-up as %s', async (role) => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: `evil.${role.toLowerCase()}@x.com`, password: 'password123', fullName: 'Evil Person', role });
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({ path: 'role' })]));
    expect(await prisma.user.count({ where: { email: `evil.${role.toLowerCase()}@x.com` } })).toBe(0);
  });

  it('creates a student and starts an httpOnly session without exposing a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new.student@x.com', password: 'password123', fullName: 'New Student' });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ role: 'STUDENT', email: 'new.student@x.com' });
    expect(res.body).not.toHaveProperty('token');
    expect(res.body.user).not.toHaveProperty('password');
    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toMatch(/haya_session=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  it('returns field errors in a consistent shape', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'nope', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
    const paths = res.body.errors.map((e) => e.path);
    expect(paths).toEqual(expect.arrayContaining(['email', 'password', 'fullName']));
  });
});

describe('login and sessions', () => {
  it('rejects a wrong password with a generic message', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: fx.t1.email, password: 'wrong-password1' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('gives the same answer for an unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@x.com', password: 'whatever1' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('keeps the session in a cookie and ends it on logout', async () => {
    const agent = await loginAs(fx.t1.email);
    expect((await agent.get('/api/auth/profile')).status).toBe(200);
    await agent.post('/api/auth/logout');
    expect((await agent.get('/api/auth/profile')).status).toBe(401);
  });

  it('reports an anonymous session check as 200 with no user', async () => {
    const res = await request(app).get('/api/auth/session');
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });

  it('blocks cross-origin state-changing requests', async () => {
    const res = await request(app).post('/api/auth/logout').set('Origin', 'https://evil.example');
    expect(res.status).toBe(403);
  });
});

describe('admin-only account creation', () => {
  it('lets an admin create a teacher', async () => {
    const admin = await loginAs(fx.admin.email);
    const res = await admin
      .post('/api/users')
      .send({ email: 'created.teacher@x.com', password: 'password123', fullName: 'Created Teacher', role: 'TEACHER' });
    expect(res.status).toBe(201);
    expect(res.body.user.teacher).toBeTruthy();
  });

  it('forbids teachers from creating accounts', async () => {
    const teacher = await loginAs(fx.t1.email);
    const res = await teacher
      .post('/api/users')
      .send({ email: 'sneaky@x.com', password: 'password123', fullName: 'Sneaky', role: 'ADMIN' });
    expect(res.status).toBe(403);
  });
});

describe('demo accounts', () => {
  it('are read-only', async () => {
    const demo = request.agent(app);
    await demo.post('/api/auth/demo').send({ role: 'TEACHER' }).expect(200);
    const res = await demo.post('/api/classes').send({ name: 'Nope', level: 'Nope' });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/read-only demo/i);
  });
});
