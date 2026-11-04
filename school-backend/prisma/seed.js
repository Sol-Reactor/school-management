// Demo data for Haya: a small, realistic school plus four read-only demo logins.
//
//   npm run db:seed
//
// Safe to re-run: it only deletes and recreates records that belong to the demo
// (users with @demo.haya.app emails, and the classes/subjects/exams they own).
// Nothing else in the database is touched. Output is deterministic.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DOMAIN = 'demo.haya.app';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'HayaDemo#2026';
const WEEKS_OF_HISTORY = 8;

// ---------- deterministic randomness ----------
let seed = 20261104;
const rand = () => {
  // mulberry32
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const between = (min, max) => min + rand() * (max - min);
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const slug = (name) => name.toLowerCase().normalize('NFD').replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '');
const email = (name) => `${slug(name)}@${DOMAIN}`;

// ---------- the school ----------
const TEACHERS = [
  { key: 'haddad', name: 'Leila Haddad', demo: 'teacher' },
  { key: 'mensah', name: 'Daniel Mensah' },
  { key: 'raman', name: 'Priya Raman' },
  { key: 'ortega', name: 'Tomás Ortega' },
];

const CLASSES = [
  { key: '7A', name: 'Grade 7A', level: 'Grade 7', homeroom: 'haddad' },
  { key: '8A', name: 'Grade 8A', level: 'Grade 8', homeroom: 'mensah' },
  { key: '9A', name: 'Grade 9A', level: 'Grade 9', homeroom: 'haddad' },
];

// Subject → teacher per class.
const SUBJECTS = [
  { code: 'MATH', name: 'Mathematics', teacher: { '7A': 'haddad', '8A': 'mensah', '9A': 'haddad' } },
  { code: 'ENG', name: 'English', teacher: { '7A': 'raman', '8A': 'raman', '9A': 'raman' } },
  { code: 'SCI', name: 'Science', teacher: { '7A': 'ortega', '8A': 'ortega', '9A': 'ortega' } },
  { code: 'HIST', name: 'History', teacher: { '7A': 'mensah', '8A': 'mensah', '9A': 'mensah' } },
];

// 30 students. `trend` < 0 marks students whose attendance and marks slip in the last
// three weeks — these are what the at-risk insight should surface.
const STUDENTS = [
  // Grade 7A
  { name: 'Amina Yusuf', cls: '7A', ability: 84, attendance: 0.97, demo: 'student', parent: 'yusuf' },
  { name: 'Lucas Ferreira', cls: '7A', ability: 72, attendance: 0.95 },
  { name: 'Mei Lin Chen', cls: '7A', ability: 91, attendance: 0.99, parent: 'chen' },
  { name: 'Omar Haddad-Silva', cls: '7A', ability: 63, attendance: 0.9, trend: -1 },
  { name: 'Sofia Rossi', cls: '7A', ability: 78, attendance: 0.96 },
  { name: 'Kwame Asante', cls: '7A', ability: 69, attendance: 0.94 },
  { name: 'Hana Sato', cls: '7A', ability: 88, attendance: 0.98 },
  { name: 'Noah Williams', cls: '7A', ability: 58, attendance: 0.92 },
  { name: 'Zara Ahmed', cls: '7A', ability: 75, attendance: 0.95, parent: 'ahmed' },
  { name: 'Mateo García', cls: '7A', ability: 66, attendance: 0.93 },
  // Grade 8A
  { name: 'Ava Thompson', cls: '8A', ability: 82, attendance: 0.97 },
  { name: 'Ibrahim Diallo', cls: '8A', ability: 74, attendance: 0.95 },
  { name: 'Chloé Martin', cls: '8A', ability: 89, attendance: 0.98 },
  { name: 'Ravi Patel', cls: '8A', ability: 61, attendance: 0.88, trend: -1 },
  { name: 'Ella Novak', cls: '8A', ability: 70, attendance: 0.94 },
  { name: 'Samuel Okafor', cls: '8A', ability: 77, attendance: 0.96, parent: 'okafor' },
  { name: 'Yuki Tanaka', cls: '8A', ability: 85, attendance: 0.97 },
  { name: 'Leo Fischer', cls: '8A', ability: 56, attendance: 0.91 },
  { name: 'Nadia Benali', cls: '8A', ability: 80, attendance: 0.96 },
  { name: 'Ethan Brooks', cls: '8A', ability: 67, attendance: 0.93 },
  // Grade 9A
  { name: 'Yusuf Yusuf', cls: '9A', ability: 71, attendance: 0.93, parent: 'yusuf', trend: -1 },
  { name: 'Grace Kim', cls: '9A', ability: 90, attendance: 0.99 },
  { name: 'Diego Morales', cls: '9A', ability: 64, attendance: 0.92 },
  { name: 'Fatima Zahra', cls: '9A', ability: 83, attendance: 0.97, parent: 'ahmed' },
  { name: 'Oliver Grant', cls: '9A', ability: 59, attendance: 0.9 },
  { name: 'Aisha Bello', cls: '9A', ability: 76, attendance: 0.95 },
  { name: 'Jonas Berg', cls: '9A', ability: 68, attendance: 0.94 },
  { name: 'Lina Haddad', cls: '9A', ability: 86, attendance: 0.98 },
  { name: 'Marcus Reed', cls: '9A', ability: 62, attendance: 0.89, trend: -1 },
  { name: 'Priya Nair', cls: '9A', ability: 79, attendance: 0.96, parent: 'chen' },
];

const PARENTS = [
  { key: 'yusuf', name: 'Hassan Yusuf', demo: 'parent' },
  { key: 'chen', name: 'Wei Chen' },
  { key: 'ahmed', name: 'Samira Ahmed' },
  { key: 'okafor', name: 'Grace Okafor' },
];

const ADMIN = { name: 'Nora Lindqvist', demo: 'admin' };

const PERIODS = [
  ['08:00', '08:50'],
  ['09:00', '09:50'],
  ['10:10', '11:00'],
  ['11:10', '12:00'],
];
const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

// ---------- helpers ----------
const utcDay = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
const addDays = (d, n) => new Date(d.getTime() + n * 864e5);

/** School days (Mon–Fri) from `weeks` ago up to yesterday. */
const schoolDays = (weeks) => {
  const today = utcDay(new Date());
  const days = [];
  for (let d = addDays(today, -weeks * 7); d < today; d = addDays(d, 1)) {
    const dow = d.getUTCDay();
    if (dow >= 1 && dow <= 5) days.push(d);
  }
  return days;
};

const demoEmailFilter = { endsWith: `@${DOMAIN}` };

async function removeExistingDemo() {
  const users = await prisma.user.findMany({
    where: { email: demoEmailFilter },
    select: { id: true, student: { select: { id: true } }, teacher: { select: { id: true } } },
  });
  if (users.length === 0) return;

  const userIds = users.map((u) => u.id);
  const studentIds = users.map((u) => u.student?.id).filter(Boolean);
  const teacherIds = users.map((u) => u.teacher?.id).filter(Boolean);
  const classIds = (await prisma.class.findMany({ where: { teacherId: { in: teacherIds } }, select: { id: true } })).map((c) => c.id);

  const optional = [];
  // Present from Phase 3 onwards; tolerate older schemas.
  if (prisma.aiSummary) optional.push(prisma.aiSummary.deleteMany({ where: { studentId: { in: studentIds } } }));

  await prisma.$transaction([
    ...optional,
    prisma.attendance.deleteMany({ where: { OR: [{ studentId: { in: studentIds } }, { classId: { in: classIds } }] } }),
    prisma.grade.deleteMany({ where: { OR: [{ studentId: { in: studentIds } }, { exam: { teacherId: { in: teacherIds } } }] } }),
    prisma.enrollment.deleteMany({ where: { OR: [{ studentId: { in: studentIds } }, { classId: { in: classIds } }] } }),
    prisma.exam.deleteMany({ where: { OR: [{ teacherId: { in: teacherIds } }, { classId: { in: classIds } }] } }),
    prisma.timetable.deleteMany({ where: { OR: [{ teacherId: { in: teacherIds } }, { classId: { in: classIds } }] } }),
    prisma.subject.deleteMany({ where: { classId: { in: classIds } } }),
    prisma.student.updateMany({ where: { classId: { in: classIds } }, data: { classId: null } }),
    prisma.class.deleteMany({ where: { id: { in: classIds } } }),
    prisma.notification.deleteMany({ where: { userId: { in: userIds } } }),
    prisma.user.deleteMany({ where: { id: { in: userIds } } }),
  ]);
}

async function main() {
  console.log('Seeding demo school…');
  await removeExistingDemo();

  const demoHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  // Non-login data accounts get an unguessable password.
  const lockedHash = await bcrypt.hash(`locked-${Date.now()}-${Math.random()}`, 10);
  const demoEmail = (role) => `${role}@${DOMAIN}`;

  const mkUser = (data) => prisma.user.create({ data: { isDemo: true, ...data } });

  // Admin
  await mkUser({ email: demoEmail('admin'), password: demoHash, fullName: ADMIN.name, role: 'ADMIN' });

  // Teachers
  const teacherId = {};
  const teacherUserId = {};
  for (const t of TEACHERS) {
    const user = await mkUser({
      email: t.demo ? demoEmail(t.demo) : email(t.name),
      password: t.demo ? demoHash : lockedHash,
      fullName: t.name,
      role: 'TEACHER',
      teacher: { create: {} },
    });
    const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });
    teacherId[t.key] = teacher.id;
    teacherUserId[t.key] = user.id;
  }

  // Parents
  const parentId = {};
  const parentUserId = {};
  for (const p of PARENTS) {
    const user = await mkUser({
      email: p.demo ? demoEmail(p.demo) : email(p.name),
      password: p.demo ? demoHash : lockedHash,
      fullName: p.name,
      role: 'PARENT',
      parent: { create: {} },
    });
    parentId[p.key] = (await prisma.parent.findUnique({ where: { userId: user.id } })).id;
    parentUserId[p.key] = user.id;
  }

  // Classes + subjects
  const classId = {};
  const subjectId = {}; // `${cls}:${code}`
  for (const c of CLASSES) {
    const cls = await prisma.class.create({ data: { name: c.name, level: c.level, teacherId: teacherId[c.homeroom] } });
    classId[c.key] = cls.id;
    for (const s of SUBJECTS) {
      const subj = await prisma.subject.create({ data: { name: s.name, code: `D${c.key}-${s.code}`, classId: cls.id } });
      subjectId[`${c.key}:${s.code}`] = subj.id;
    }
  }

  // Students + enrollments
  const students = [];
  for (const s of STUDENTS) {
    const user = await mkUser({
      email: s.demo ? demoEmail(s.demo) : email(s.name),
      password: s.demo ? demoHash : lockedHash,
      fullName: s.name,
      role: 'STUDENT',
      student: { create: { classId: classId[s.cls], parentId: s.parent ? parentId[s.parent] : null } },
    });
    const student = await prisma.student.findUnique({ where: { userId: user.id } });
    await prisma.enrollment.create({
      data: { studentId: student.id, classId: classId[s.cls], createdAt: addDays(new Date(), -WEEKS_OF_HISTORY * 7 - 3) },
    });
    students.push({ ...s, id: student.id, userId: user.id });
  }

  // Timetable: rotate subjects across periods; skip any slot that would double-book a teacher.
  const busy = new Set();
  const timetable = [];
  CLASSES.forEach((c, ci) => {
    DAYS.forEach((day, di) => {
      PERIODS.forEach(([startTime, endTime], pi) => {
        for (let attempt = 0; attempt < SUBJECTS.length; attempt++) {
          const subj = SUBJECTS[(pi + ci + di + attempt) % SUBJECTS.length];
          const tKey = subj.teacher[c.key];
          const slot = `${tKey}:${day}:${pi}`;
          if (busy.has(slot)) continue;
          busy.add(slot);
          timetable.push({ classId: classId[c.key], subjectId: subjectId[`${c.key}:${subj.code}`], teacherId: teacherId[tKey], day, startTime, endTime });
          break;
        }
      });
    });
  });
  await prisma.timetable.createMany({ data: timetable });

  // Attendance: per school day, per student. Declining students slip in the last 3 weeks.
  const days = schoolDays(WEEKS_OF_HISTORY);
  const recentCutoff = addDays(utcDay(new Date()), -21);
  const attendance = [];
  for (const s of students) {
    for (const date of days) {
      let pPresent = s.attendance;
      if (s.trend < 0 && date >= recentCutoff) pPresent -= 0.22;
      const r = rand();
      const status = r < pPresent ? (rand() < 0.06 ? 'LATE' : 'PRESENT') : rand() < 0.3 ? 'EXCUSED' : 'ABSENT';
      attendance.push({ studentId: s.id, classId: classId[s.cls], date, status });
    }
  }
  await prisma.attendance.createMany({ data: attendance });

  // Exams: four past assessments per subject (graded) + one upcoming per subject.
  const today = utcDay(new Date());
  const pastOffsets = [-52, -38, -24, -9]; // days ago (spread over the history window)
  const assessments = ['Unit quiz 1', 'Unit test', 'Unit quiz 2', 'Mid-term exam'];
  const subjectOffset = { MATH: -3, ENG: 2, SCI: 0, HIST: 4 };
  let gradeCount = 0;

  for (const c of CLASSES) {
    const classStudents = students.filter((s) => s.cls === c.key);
    for (const subj of SUBJECTS) {
      const tKey = subj.teacher[c.key];
      for (let i = 0; i < pastOffsets.length; i++) {
        // Stagger by subject so not every exam lands on the same day.
        let date = addDays(today, pastOffsets[i] + SUBJECTS.indexOf(subj));
        while ([0, 6].includes(date.getUTCDay())) date = addDays(date, 1);
        const exam = await prisma.exam.create({
          data: { name: assessments[i], date, classId: classId[c.key], subjectId: subjectId[`${c.key}:${subj.code}`], teacherId: teacherId[tKey] },
        });
        const grades = classStudents.map((s) => {
          let marks = s.ability + subjectOffset[subj.code] + between(-8, 8);
          if (s.trend < 0 && i >= 2) marks -= i === 2 ? 9 : 16; // slipping on the latest two
          return { examId: exam.id, studentId: s.id, subjectId: exam.subjectId, marks: Math.round(clamp(marks, 18, 100)) };
        });
        await prisma.grade.createMany({ data: grades });
        gradeCount += grades.length;
      }
      // Upcoming
      let upcoming = addDays(today, 4 + SUBJECTS.indexOf(subj) * 3 + CLASSES.indexOf(c));
      while ([0, 6].includes(upcoming.getUTCDay())) upcoming = addDays(upcoming, 1);
      await prisma.exam.create({
        data: { name: 'End-of-unit test', date: upcoming, classId: classId[c.key], subjectId: subjectId[`${c.key}:${subj.code}`], teacherId: teacherId[tKey] },
      });
    }
  }

  // A few notifications so the bell isn't empty.
  const ago = (h) => new Date(Date.now() - h * 36e5);
  const adminUser = await prisma.user.findUnique({ where: { email: demoEmail('admin') } });
  const demoStudent = students.find((s) => s.demo === 'student');
  await prisma.notification.createMany({
    data: [
      { userId: adminUser.id, title: 'Weekly attendance report ready', message: 'School-wide attendance was 94% last week.', type: 'GENERAL', createdAt: ago(5) },
      { userId: adminUser.id, title: 'New enrollment', message: 'Priya Nair was enrolled in Grade 9A.', type: 'ENROLLMENT', read: true, createdAt: ago(50) },
      { userId: teacherUserId.haddad, title: 'Mid-term grades due', message: 'Enter Grade 9A Mathematics mid-term marks by Friday.', type: 'EXAM_SCHEDULED', createdAt: ago(3) },
      { userId: teacherUserId.haddad, title: 'Attendance reminder', message: "Today's Grade 7A register hasn't been taken yet.", type: 'ATTENDANCE_MARKED', createdAt: ago(1) },
      { userId: demoStudent.userId, title: 'New grade posted', message: 'Your Mathematics mid-term exam has been graded.', type: 'GRADE_POSTED', createdAt: ago(20) },
      { userId: demoStudent.userId, title: 'Upcoming exam', message: 'Mathematics end-of-unit test is coming up.', type: 'EXAM_SCHEDULED', read: true, createdAt: ago(70) },
      { userId: parentUserId.yusuf, title: 'Attendance alert', message: 'Yusuf missed two days of school this week.', type: 'ATTENDANCE_MARKED', createdAt: ago(8) },
      { userId: parentUserId.yusuf, title: 'New grade posted', message: "Amina's Mathematics mid-term has been graded.", type: 'GRADE_POSTED', read: true, createdAt: ago(22) },
    ],
  });

  console.log(
    `Done: ${CLASSES.length} classes, ${TEACHERS.length} teachers, ${students.length} students, ` +
      `${attendance.length} attendance records, ${gradeCount} grades, ${timetable.length} timetable slots.`
  );
  console.log(`Demo logins: admin|teacher|student|parent@${DOMAIN} (password from DEMO_PASSWORD, or the default in docs).`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
