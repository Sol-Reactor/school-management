// Single source of truth for "who can see / change what".
//
//   ADMIN    everything
//   TEACHER  classes they teach, and students in those classes
//   STUDENT  themselves and their own class
//   PARENT   their own children and their children's classes
//
// Controllers call these helpers instead of re-implementing checks, and the AI
// endpoint reuses exactly the same rules.
import prisma from './prisma.js';
import { forbidden, notFound } from './errors.js';

const isAdmin = (user) => user?.role === 'ADMIN';

/**
 * Demo sessions are sandboxed to demo data: a demo admin must never see real
 * users who signed up on the live site. `isFullAdmin` is the unrestricted admin.
 */
export const isFullAdmin = (user) => isAdmin(user) && !user.isDemo;

/** Prisma `where` on User: limits demo sessions to demo-owned users. */
export const demoUserFilter = (user) => (user?.isDemo ? { isDemo: true } : {});
/** Same, for relations that point at a profile with a `user` (Student/Teacher/Parent). */
export const demoProfileFilter = (user) => (user?.isDemo ? { user: { isDemo: true } } : {});
/** Same, for classes (owned via their teacher). */
export const demoClassFilter = (user) => (user?.isDemo ? { teacher: { user: { isDemo: true } } } : {});

/** Prisma `where` fragment matching students a teacher teaches. */
const taughtByTeacher = (teacherId) => ({
  OR: [
    { class: { teacherId } },
    { enrollments: { some: { class: { teacherId } } } },
  ],
});

/**
 * Prisma `where` filter for the students `user` may see.
 * Returns `{}` for admins (no restriction).
 */
export const studentScope = (user) => {
  switch (user.role) {
    case 'ADMIN':
      return demoProfileFilter(user);
    case 'TEACHER':
      return taughtByTeacher(user.teacher?.id ?? '__none__');
    case 'STUDENT':
      return { id: user.student?.id ?? '__none__' };
    case 'PARENT':
      return { parentId: user.parent?.id ?? '__none__' };
    default:
      return { id: '__none__' };
  }
};

/** Prisma `where` filter for the classes `user` may see. */
export const classScope = (user) => {
  switch (user.role) {
    case 'ADMIN':
      return demoClassFilter(user);
    case 'TEACHER':
      return { teacherId: user.teacher?.id ?? '__none__' };
    case 'STUDENT':
      return {
        OR: [
          { students: { some: { id: user.student?.id ?? '__none__' } } },
          { enrollments: { some: { studentId: user.student?.id ?? '__none__' } } },
        ],
      };
    case 'PARENT':
      return {
        OR: [
          { students: { some: { parentId: user.parent?.id ?? '__none__' } } },
          { enrollments: { some: { student: { parentId: user.parent?.id ?? '__none__' } } } },
        ],
      };
    default:
      return { id: '__none__' };
  }
};

export const canViewStudent = async (user, studentId) => {
  if (!studentId) return false;
  if (isFullAdmin(user)) return true;
  if (user.role === 'STUDENT') return user.student?.id === studentId;
  const match = await prisma.student.findFirst({
    where: { id: studentId, ...studentScope(user) },
    select: { id: true },
  });
  return !!match;
};

export const canViewClass = async (user, classId) => {
  if (!classId) return false;
  if (isFullAdmin(user)) return true;
  const match = await prisma.class.findFirst({
    where: { id: classId, ...classScope(user) },
    select: { id: true },
  });
  return !!match;
};

/** Teachers manage only classes they teach; admins manage all. */
export const canManageClass = async (user, classId) => {
  if (!classId) return false;
  if (isFullAdmin(user)) return true;
  if (isAdmin(user)) return canViewClass(user, classId); // demo admin: demo classes only
  if (user.role !== 'TEACHER' || !user.teacher?.id) return false;
  const match = await prisma.class.findFirst({
    where: { id: classId, teacherId: user.teacher.id },
    select: { id: true },
  });
  return !!match;
};

/**
 * Teaches the class in any capacity: class teacher, or a subject teacher with a
 * timetable slot or exam in it. Grants read access to the roster (e.g. for a
 * gradebook) but not class management.
 */
export const canTeachClass = async (user, classId) => {
  if (await canManageClass(user, classId)) return true;
  if (user.role !== 'TEACHER' || !user.teacher?.id) return false;
  const teacherId = user.teacher.id;
  const match = await prisma.class.findFirst({
    where: { id: classId, OR: [{ timetable: { some: { teacherId } } }, { exams: { some: { teacherId } } }] },
    select: { id: true },
  });
  return !!match;
};

// ---------- assert helpers (throw 403/404) ----------

export const assertCanViewStudent = async (user, studentId) => {
  if (!(await canViewStudent(user, studentId))) {
    // 404 for "exists but not yours" would leak less, but 403 is clearer for the UI.
    throw forbidden('You do not have access to this student');
  }
};

export const assertCanViewClass = async (user, classId) => {
  if (!(await canViewClass(user, classId))) throw forbidden('You do not have access to this class');
};

export const assertCanManageClass = async (user, classId) => {
  if (!(await canManageClass(user, classId))) {
    throw forbidden('Only the class teacher or an admin can do this');
  }
};

export const assertSelfOrAdmin = async (user, profileKey, profileId) => {
  if (isFullAdmin(user)) return;
  if (isAdmin(user)) {
    // Demo admin: only profiles that belong to demo users.
    const model = { student: prisma.student, teacher: prisma.teacher, parent: prisma.parent }[profileKey];
    const match = await model.findFirst({ where: { id: profileId, user: { isDemo: true } }, select: { id: true } });
    if (match) return;
    throw forbidden();
  }
  if (user[profileKey]?.id !== profileId) throw forbidden();
};

/** Loads an exam and checks the user may manage it (owning teacher, class teacher or admin). */
export const assertCanManageExam = async (user, examId) => {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: { id: true, classId: true, subjectId: true, teacherId: true },
  });
  if (!exam) throw notFound('Exam not found');
  if (isFullAdmin(user)) return exam;
  if (isAdmin(user) && (await canViewClass(user, exam.classId))) return exam;
  const teacherId = user.teacher?.id;
  if (user.role === 'TEACHER' && teacherId) {
    if (exam.teacherId === teacherId || (await canManageClass(user, exam.classId))) return exam;
  }
  throw forbidden('Only the exam teacher or an admin can do this');
};
