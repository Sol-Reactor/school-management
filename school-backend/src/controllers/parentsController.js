import prisma from '../lib/prisma.js';
import { notFound } from '../lib/errors.js';
import { assertSelfOrAdmin, demoProfileFilter } from '../lib/access.js';

const childInclude = (take) => ({
  user: { select: { id: true, fullName: true, email: true } },
  class: {
    select: {
      id: true,
      name: true,
      level: true,
      teacher: { include: { user: { select: { fullName: true } } } },
    },
  },
  grades: {
    include: {
      exam: { select: { name: true, date: true } },
      subject: { select: { name: true } },
    },
    orderBy: { exam: { date: 'desc' } },
    ...(take && { take }),
  },
  attendance: {
    include: { class: { select: { name: true } } },
    orderBy: { date: 'desc' },
    ...(take && { take }),
  },
});

// GET /api/parents (admin)
export const getParents = async (req, res) => {
  const parents = await prisma.parent.findMany({
    where: demoProfileFilter(req.user),
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      _count: { select: { students: true } },
    },
    orderBy: { user: { fullName: 'asc' } },
  });
  res.json({ parents });
};

// GET /api/parents/:id (self/admin)
export const getParentById = async (req, res) => {
  const { id } = req.params;
  await assertSelfOrAdmin(req.user, 'parent', id);

  const parent = await prisma.parent.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, fullName: true, email: true, role: true, createdAt: true } },
      students: { include: childInclude(10) },
    },
  });
  if (!parent) throw notFound('Parent not found');
  res.json({ parent });
};

// GET /api/parents/:id/children (self/admin)
export const getParentChildren = async (req, res) => {
  const { id } = req.params;
  await assertSelfOrAdmin(req.user, 'parent', id);

  const children = await prisma.student.findMany({
    where: { parentId: id },
    include: childInclude(),
  });
  res.json({ children });
};
