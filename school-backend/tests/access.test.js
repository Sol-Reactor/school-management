import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loginAs, prisma, resetDb, seedFixture } from './helpers.js';

let fx;
beforeAll(async () => {
  await resetDb();
  fx = await seedFixture();
});
afterAll(() => prisma.$disconnect());

describe('student records', () => {
  it('a student can read themself but not a classmate', async () => {
    const s1 = await loginAs(fx.s1.email);
    expect((await s1.get(`/api/students/${fx.s1.student.id}`)).status).toBe(200);
    expect((await s1.get(`/api/students/${fx.s2.student.id}`)).status).toBe(403);
    expect((await s1.get(`/api/grades/student/${fx.s2.student.id}`)).status).toBe(403);
  });

  it('a parent can read their own children only', async () => {
    const parent = await loginAs(fx.parent.email);
    expect((await parent.get(`/api/students/${fx.s1.student.id}`)).status).toBe(200);
    expect((await parent.get(`/api/students/${fx.s2.student.id}`)).status).toBe(200);
    expect((await parent.get(`/api/students/${fx.s3.student.id}`)).status).toBe(403);
    expect((await parent.get(`/api/parents/${fx.otherParent.parent.id}/children`)).status).toBe(403);
  });

  it('a teacher sees only students in their classes', async () => {
    const t1 = await loginAs(fx.t1.email);
    const list = await t1.get('/api/students');
    expect(list.status).toBe(200);
    const ids = list.body.students.map((s) => s.id).sort();
    expect(ids).toEqual([fx.s1.student.id, fx.s2.student.id].sort());
    expect((await t1.get(`/api/students/${fx.s3.student.id}`)).status).toBe(403);
  });

  it('an admin can read anyone', async () => {
    const admin = await loginAs(fx.admin.email);
    expect((await admin.get(`/api/students/${fx.s3.student.id}`)).status).toBe(200);
  });
});

describe('class management', () => {
  it("a teacher can't mark attendance in another teacher's class", async () => {
    const t2 = await loginAs(fx.t2.email);
    const res = await t2.post('/api/attendance').send({ studentId: fx.s1.student.id, classId: fx.c1.id, date: '2026-01-05', status: 'PRESENT' });
    expect(res.status).toBe(403);
  });

  it('rejects marking a student who is not in the class', async () => {
    const t1 = await loginAs(fx.t1.email);
    const res = await t1.post('/api/attendance').send({ studentId: fx.s3.student.id, classId: fx.c1.id, date: '2026-01-05', status: 'PRESENT' });
    expect(res.status).toBe(400);
  });

  it('rejects overlapping timetable slots for the same class', async () => {
    const admin = await loginAs(fx.admin.email);
    const base = { classId: fx.c1.id, subjectId: fx.subject.id, teacherId: fx.t1.teacher.id, day: 'MONDAY' };
    expect((await admin.post('/api/timetable').send({ ...base, startTime: '09:00', endTime: '10:00' })).status).toBe(201);
    // Fully contains the existing slot: the old check missed this case.
    const clash = await admin.post('/api/timetable').send({ ...base, startTime: '08:30', endTime: '10:30' });
    expect(clash.status).toBe(409);
  });
});
