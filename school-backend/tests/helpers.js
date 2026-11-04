// Test helpers: a tiny fixture school built directly with Prisma, and
// cookie-carrying Supertest agents for each role.
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import prisma from '../src/lib/prisma.js';

export const app = createApp();
export const PASSWORD = 'password123';

const hash = bcrypt.hashSync(PASSWORD, 4); // low cost: tests only

/** Deletes everything, in FK-safe order. Runs against the dedicated test database only. */
export const resetDb = async () => {
  if (!/test/i.test(process.env.DATABASE_URL ?? '')) {
    throw new Error('Refusing to reset a database whose URL does not contain "test".');
  }
  await prisma.$transaction([
    prisma.aiInsight.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.grade.deleteMany(),
    prisma.attendance.deleteMany(),
    prisma.exam.deleteMany(),
    prisma.timetable.deleteMany(),
    prisma.enrollment.deleteMany(),
    prisma.subject.deleteMany(),
    prisma.student.updateMany({ data: { classId: null, parentId: null } }),
    prisma.class.deleteMany(),
    prisma.user.deleteMany(),
  ]);
};

const mkUser = (email, role, extra = {}) =>
  prisma.user.create({
    data: {
      email,
      password: hash,
      fullName: email.split('@')[0].replace(/\./g, ' '),
      role,
      ...(role === 'STUDENT' && { student: { create: {} } }),
      ...(role === 'TEACHER' && { teacher: { create: {} } }),
      ...(role === 'PARENT' && { parent: { create: {} } }),
      ...extra,
    },
    include: { student: true, teacher: true, parent: true },
  });

/**
 * Two classes, two teachers, three students (two share a parent), plus enough
 * attendance and grades for AI summaries and at-risk flags.
 */
export const seedFixture = async () => {
  const admin = await mkUser('admin@test.haya', 'ADMIN');
  const t1 = await mkUser('teacher.one@test.haya', 'TEACHER');
  const t2 = await mkUser('teacher.two@test.haya', 'TEACHER');
  const parent = await mkUser('parent@test.haya', 'PARENT');
  const otherParent = await mkUser('other.parent@test.haya', 'PARENT');
  const demoTeacher = await mkUser('teacher@demo.haya.app', 'TEACHER', { isDemo: true });

  const c1 = await prisma.class.create({ data: { name: 'T7A', level: 'Grade 7', teacherId: t1.teacher.id } });
  const c2 = await prisma.class.create({ data: { name: 'T8A', level: 'Grade 8', teacherId: t2.teacher.id } });
  const subject = await prisma.subject.create({ data: { name: 'Mathematics', code: 'T7A-MATH', classId: c1.id } });

  const s1 = await mkUser('student.one@test.haya', 'STUDENT');
  const s2 = await mkUser('student.two@test.haya', 'STUDENT');
  const s3 = await mkUser('student.three@test.haya', 'STUDENT');
  await prisma.student.update({ where: { id: s1.student.id }, data: { classId: c1.id, parentId: parent.parent.id } });
  await prisma.student.update({ where: { id: s2.student.id }, data: { classId: c1.id, parentId: parent.parent.id } });
  await prisma.student.update({ where: { id: s3.student.id }, data: { classId: c2.id, parentId: otherParent.parent.id } });

  // s1: steady and healthy. s2: attendance and marks collapse in the last three weeks.
  const day = 864e5;
  const today = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
  const attendance = [];
  for (let i = 1; i <= 40; i++) {
    const date = new Date(today.getTime() - i * day);
    attendance.push({ studentId: s1.student.id, classId: c1.id, date, status: 'PRESENT' });
    attendance.push({ studentId: s2.student.id, classId: c1.id, date, status: i <= 21 && i % 3 === 0 ? 'ABSENT' : i <= 21 && i % 2 === 0 ? 'ABSENT' : 'PRESENT' });
  }
  await prisma.attendance.createMany({ data: attendance });

  const examDays = [45, 35, 10, 5];
  for (const [idx, d] of examDays.entries()) {
    const exam = await prisma.exam.create({
      data: { name: `Test ${idx + 1}`, date: new Date(today.getTime() - d * day), classId: c1.id, subjectId: subject.id, teacherId: t1.teacher.id },
    });
    await prisma.grade.createMany({
      data: [
        { examId: exam.id, studentId: s1.student.id, subjectId: subject.id, marks: 80 + idx },
        { examId: exam.id, studentId: s2.student.id, subjectId: subject.id, marks: idx < 2 ? 75 : 45 },
      ],
    });
  }

  return { admin, t1, t2, parent, otherParent, demoTeacher, c1, c2, subject, s1, s2, s3 };
};

/** A Supertest agent that keeps the session cookie between requests. */
export const loginAs = async (email, password = PASSWORD) => {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').send({ email, password });
  if (res.status !== 200) throw new Error(`login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  return agent;
};

export { prisma, request };
