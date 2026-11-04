import prisma from '../lib/prisma.js';
import { badRequest, conflict, notFound } from '../lib/errors.js';
import { createUserWithProfile } from './authController.js';
import { demoUserFilter } from '../lib/access.js';
import { createNotification, notifySafely } from './notificationController.js';

const listSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  isDemo: true,
  createdAt: true,
  updatedAt: true,
  student: { select: { id: true } },
  teacher: { select: { id: true } },
  parent: { select: { id: true } },
};

// GET /api/users (admin)
export const getUsers = async (req, res) => {
  const { role, search, page, limit } = req.query;
  const where = {
    ...demoUserFilter(req.user),
    ...(role && { role }),
    ...(search && {
      OR: [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: listSelect,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};

// GET /api/users/:id (admin)
export const getUserById = async (req, res) => {
  const user = await prisma.user.findFirst({
    where: { id: req.params.id, ...demoUserFilter(req.user) },
    select: {
      ...listSelect,
      student: { include: { class: { select: { id: true, name: true, level: true } } } },
      teacher: { include: { classes: { select: { id: true, name: true, level: true } } } },
      parent: {
        include: {
          students: { include: { class: { select: { id: true, name: true, level: true } } } },
        },
      },
    },
  });
  if (!user) throw notFound('User not found');
  res.json({ user });
};

// POST /api/users (admin) — the only way to create TEACHER and ADMIN accounts.
export const createUser = async (req, res) => {
  const { email } = req.body;
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    throw conflict('An account with this email already exists');
  }
  const user = await createUserWithProfile(req.body);
  notifySafely(
    createNotification(user.id, 'Welcome to Haya', `An administrator created your ${user.role.toLowerCase()} account.`)
  );
  res.status(201).json({ message: 'User created', user });
};

// PUT /api/users/:id (admin)
// Role changes are intentionally not supported: a role is tied to a profile row
// (Student/Teacher/Parent) and its records, so changing it in place would orphan data.
export const updateUser = async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { fullName: req.body.fullName },
    select: listSelect,
  });
  res.json({ message: 'User updated', user });
};

// DELETE /api/users/:id (admin)
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  if (id === req.user.id) throw badRequest('You cannot delete your own account');

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      student: { select: { id: true } },
      teacher: { select: { id: true, _count: { select: { exams: true, timetable: true } } } },
      parent: { select: { id: true } },
    },
  });
  if (!user) throw notFound('User not found');

  if (user.teacher && (user.teacher._count.exams > 0 || user.teacher._count.timetable > 0)) {
    throw conflict('This teacher still has exams or timetable slots. Reassign or remove them first.');
  }

  const ops = [prisma.notification.deleteMany({ where: { userId: id } })];
  if (user.student) {
    const studentId = user.student.id;
    ops.push(
      prisma.attendance.deleteMany({ where: { studentId } }),
      prisma.grade.deleteMany({ where: { studentId } }),
      prisma.enrollment.deleteMany({ where: { studentId } })
    );
  }
  if (user.teacher) {
    ops.push(prisma.class.updateMany({ where: { teacherId: user.teacher.id }, data: { teacherId: null } }));
  }
  if (user.parent) {
    ops.push(prisma.student.updateMany({ where: { parentId: user.parent.id }, data: { parentId: null } }));
  }
  ops.push(prisma.user.delete({ where: { id } })); // cascades to the profile row

  await prisma.$transaction(ops);
  res.json({ message: 'User deleted' });
};
