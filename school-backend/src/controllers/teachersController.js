import prisma from '../lib/prisma.js';
import { notFound } from '../lib/errors.js';
import { assertSelfOrAdmin, demoProfileFilter } from '../lib/access.js';
import { DAYS } from '../validation/schemas.js';

// GET /api/teachers (admin)
export const getTeachers = async (req, res) => {
  const teachers = await prisma.teacher.findMany({
    where: demoProfileFilter(req.user),
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      classes: { select: { id: true, name: true, level: true } },
      _count: { select: { classes: true, exams: true } },
    },
    orderBy: { user: { fullName: 'asc' } },
  });
  res.json({ teachers });
};

// GET /api/teachers/:id (self/admin)
export const getTeacherById = async (req, res) => {
  const { id } = req.params;
  await assertSelfOrAdmin(req.user, 'teacher', id);

  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, fullName: true, email: true, role: true, createdAt: true } },
      classes: {
        include: {
          students: { include: { user: { select: { fullName: true, email: true } } } },
          subjects: { select: { id: true, name: true, code: true } },
        },
      },
      exams: {
        include: { class: { select: { name: true } }, subject: { select: { name: true } } },
        orderBy: { date: 'desc' },
        take: 10,
      },
      timetable: {
        include: { class: { select: { name: true } }, subject: { select: { name: true } } },
      },
    },
  });
  if (!teacher) throw notFound('Teacher not found');

  teacher.timetable.sort(
    (a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.startTime.localeCompare(b.startTime)
  );
  res.json({ teacher });
};

// GET /api/teachers/:id/classes (self/admin)
export const getTeacherClasses = async (req, res) => {
  const { id } = req.params;
  await assertSelfOrAdmin(req.user, 'teacher', id);

  const classes = await prisma.class.findMany({
    where: { teacherId: id },
    include: {
      students: { include: { user: { select: { fullName: true, email: true } } } },
      subjects: { select: { id: true, name: true, code: true } },
      _count: { select: { students: true, subjects: true } },
    },
  });
  res.json({ classes });
};

// GET /api/teachers/:id/students (self/admin)
export const getTeacherStudents = async (req, res) => {
  const { id } = req.params;
  await assertSelfOrAdmin(req.user, 'teacher', id);

  const students = await prisma.student.findMany({
    where: { OR: [{ class: { teacherId: id } }, { enrollments: { some: { class: { teacherId: id } } } }] },
    include: {
      user: { select: { fullName: true, email: true } },
      class: { select: { name: true, level: true } },
      parent: { include: { user: { select: { fullName: true, email: true } } } },
      grades: { include: { subject: { select: { name: true } } } },
    },
    orderBy: { user: { fullName: 'asc' } },
  });
  res.json({ students });
};
