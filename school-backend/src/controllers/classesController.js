import prisma from '../lib/prisma.js';
import { badRequest, conflict, forbidden, notFound } from '../lib/errors.js';
import {
  assertCanManageClass,
  assertCanViewClass,
  canManageClass,
  classScope,
} from '../lib/access.js';
import { createNotification, notifyAdmins, notifySafely } from './notificationController.js';

const teacherSummary = { include: { user: { select: { id: true, fullName: true, email: true } } } };

// GET /api/classes — admins see all, teachers their own, students/parents their (children's) classes.
export const getClasses = async (req, res) => {
  const { teacherId } = req.query;
  const where = {
    AND: [classScope(req.user), req.user.role === 'ADMIN' && teacherId ? { teacherId } : {}],
  };

  const classes = await prisma.class.findMany({
    where,
    include: {
      teacher: teacherSummary,
      _count: { select: { students: true, subjects: true } },
    },
    orderBy: { name: 'asc' },
  });

  res.json({ classes });
};

// GET /api/classes/:id
export const getClassById = async (req, res) => {
  const { id } = req.params;
  await assertCanViewClass(req.user, id);
  const manager = await canManageClass(req.user, id);

  const classData = await prisma.class.findUnique({
    where: { id },
    include: {
      teacher: teacherSummary,
      // Classmates' contact details and parents are only visible to the class teacher / admin.
      students: manager
        ? {
            include: {
              user: { select: { fullName: true, email: true } },
              parent: { include: { user: { select: { fullName: true, email: true } } } },
            },
          }
        : { select: { id: true, user: { select: { fullName: true } } } },
      subjects: { select: { id: true, name: true, code: true } },
      timetable: {
        include: {
          subject: { select: { name: true } },
          teacher: { include: { user: { select: { fullName: true } } } },
        },
        orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
      },
    },
  });

  if (!classData) throw notFound('Class not found');
  res.json({ class: classData });
};

// POST /api/classes (teacher/admin)
// Teachers always create classes for themselves; admins may assign any teacher by email.
export const createClass = async (req, res) => {
  const { name, level, teacherEmail } = req.body;
  let teacherId = null;

  if (req.user.role === 'TEACHER') {
    teacherId = req.user.teacher.id;
  } else if (teacherEmail) {
    const teacherUser = await prisma.user.findFirst({
      where: { email: teacherEmail, role: 'TEACHER' },
      select: { teacher: { select: { id: true } } },
    });
    if (!teacherUser?.teacher) {
      throw badRequest('No teacher found with that email', [
        { path: 'teacherEmail', message: 'No teacher found with this email' },
      ]);
    }
    teacherId = teacherUser.teacher.id;
  }

  const classData = await prisma.class.create({
    data: { name, level, teacherId },
    include: { teacher: teacherSummary },
  });

  notifySafely(
    notifyAdmins(
      'New class created',
      `${name} (${level}) was created${classData.teacher ? ` for ${classData.teacher.user.fullName}` : ''}.`,
      'CLASS_ASSIGNED'
    ),
    classData.teacher &&
      req.user.role === 'ADMIN' &&
      createNotification(
        classData.teacher.user.id,
        'Class assigned',
        `You have been assigned to teach ${name} (${level}).`,
        'CLASS_ASSIGNED'
      )
  );

  res.status(201).json({ message: 'Class created', class: classData });
};

// PUT /api/classes/:id (class teacher/admin)
export const updateClass = async (req, res) => {
  const { id } = req.params;
  await assertCanManageClass(req.user, id);

  const { teacherId, ...rest } = req.body;
  if (teacherId !== undefined && req.user.role !== 'ADMIN') {
    throw forbidden('Only an admin can change the class teacher');
  }

  const classData = await prisma.class.update({
    where: { id },
    data: { ...rest, ...(teacherId !== undefined && { teacherId }) },
    include: { teacher: teacherSummary },
  });

  res.json({ message: 'Class updated', class: classData });
};

// DELETE /api/classes/:id (admin)
export const deleteClass = async (req, res) => {
  const { id } = req.params;
  const counts = await prisma.class.findUnique({
    where: { id },
    select: { _count: { select: { exams: true, attendance: true } } },
  });
  if (!counts) throw notFound('Class not found');
  if (counts._count.exams > 0 || counts._count.attendance > 0) {
    throw conflict('This class has exams or attendance records and cannot be deleted.');
  }

  await prisma.$transaction([
    prisma.student.updateMany({ where: { classId: id }, data: { classId: null } }),
    prisma.enrollment.deleteMany({ where: { classId: id } }),
    prisma.subject.updateMany({ where: { classId: id }, data: { classId: null } }),
    prisma.timetable.deleteMany({ where: { classId: id } }),
    prisma.class.delete({ where: { id } }),
  ]);

  res.json({ message: 'Class deleted' });
};

// GET /api/classes/:id/students (class teacher/admin)
export const getClassStudents = async (req, res) => {
  const { id } = req.params;
  await assertCanManageClass(req.user, id);

  const students = await prisma.student.findMany({
    where: { OR: [{ classId: id }, { enrollments: { some: { classId: id } } }] },
    include: {
      user: { select: { fullName: true, email: true } },
      parent: { include: { user: { select: { fullName: true, email: true } } } },
      grades: {
        include: { subject: { select: { name: true } }, exam: { select: { name: true } } },
      },
    },
    orderBy: { user: { fullName: 'asc' } },
  });

  res.json({ students });
};

// GET /api/classes/:id/subjects
export const getClassSubjects = async (req, res) => {
  const { id } = req.params;
  await assertCanViewClass(req.user, id);

  const subjects = await prisma.subject.findMany({
    where: { classId: id },
    include: { _count: { select: { timetable: true, exams: true } } },
    orderBy: { name: 'asc' },
  });

  res.json({ subjects });
};
