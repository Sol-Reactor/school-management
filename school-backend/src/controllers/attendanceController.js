import prisma from '../lib/prisma.js';
import { badRequest, conflict, forbidden, notFound } from '../lib/errors.js';
import { assertCanManageClass, assertCanViewStudent, canManageClass, canViewStudent, demoProfileFilter } from '../lib/access.js';

/** Attendance is per calendar day: normalise to 00:00 UTC. */
const startOfDay = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
const dayRange = (d) => {
  const start = startOfDay(d);
  return { gte: start, lt: new Date(start.getTime() + 864e5) };
};

const summarise = (records) => {
  const summary = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0, TOTAL: records.length };
  for (const r of records) summary[r.status] += 1;
  return summary;
};

// GET /api/attendance (teacher/admin)
export const getAttendance = async (req, res) => {
  const { classId, studentId, date, page, limit } = req.query;
  const where = {
    ...(classId && { classId }),
    ...(studentId && { studentId }),
    ...(date && { date: dayRange(date) }),
    ...(req.user.role === 'TEACHER' && { class: { teacherId: req.user.teacher.id } }),
    ...(req.user.isDemo && { student: demoProfileFilter(req.user) }),
  };

  const [attendance, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      include: {
        student: { include: { user: { select: { fullName: true, email: true } } } },
        class: { select: { name: true, level: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { date: 'desc' },
    }),
    prisma.attendance.count({ where }),
  ]);

  res.json({ attendance, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};

// GET /api/attendance/:id
export const getAttendanceById = async (req, res) => {
  const attendance = await prisma.attendance.findUnique({
    where: { id: req.params.id },
    include: {
      student: {
        include: {
          user: { select: { fullName: true, email: true } },
          class: { select: { name: true } },
        },
      },
      class: { select: { name: true, level: true } },
    },
  });
  if (!attendance) throw notFound('Attendance record not found');

  const allowed =
    (await canViewStudent(req.user, attendance.studentId)) ||
    (await canManageClass(req.user, attendance.classId));
  if (!allowed) throw forbidden();

  res.json({ attendance });
};

// POST /api/attendance (class teacher/admin)
export const markAttendance = async (req, res) => {
  const { studentId, classId, status } = req.body;
  const date = startOfDay(req.body.date);
  await assertCanManageClass(req.user, classId);

  const inClass = await prisma.student.findFirst({
    where: { id: studentId, OR: [{ classId }, { enrollments: { some: { classId } } }] },
    select: { id: true },
  });
  if (!inClass) throw badRequest('This student is not in that class');

  const existing = await prisma.attendance.findFirst({
    where: { studentId, classId, date: dayRange(date) },
    select: { id: true },
  });
  if (existing) throw conflict('Attendance is already marked for this student on this date');

  const attendance = await prisma.attendance.create({
    data: { studentId, classId, date, status },
    include: {
      student: { include: { user: { select: { fullName: true } } } },
      class: { select: { name: true } },
    },
  });

  res.status(201).json({ message: 'Attendance marked', attendance });
};

// PUT /api/attendance/:id (class teacher/admin)
export const updateAttendance = async (req, res) => {
  const record = await prisma.attendance.findUnique({
    where: { id: req.params.id },
    select: { classId: true },
  });
  if (!record) throw notFound('Attendance record not found');
  await assertCanManageClass(req.user, record.classId);

  const attendance = await prisma.attendance.update({
    where: { id: req.params.id },
    data: { status: req.body.status },
    include: {
      student: { include: { user: { select: { fullName: true } } } },
      class: { select: { name: true } },
    },
  });

  res.json({ message: 'Attendance updated', attendance });
};

// GET /api/attendance/student/:studentId
export const getStudentAttendance = async (req, res) => {
  const { studentId } = req.params;
  await assertCanViewStudent(req.user, studentId);

  const { startDate, endDate } = req.query;
  const where = {
    studentId,
    ...((startDate || endDate) && {
      date: { ...(startDate && { gte: startOfDay(startDate) }), ...(endDate && { lte: endDate }) },
    }),
  };

  const attendance = await prisma.attendance.findMany({
    where,
    include: { class: { select: { name: true } } },
    orderBy: { date: 'desc' },
  });

  res.json({ attendance, summary: summarise(attendance) });
};

// GET /api/attendance/class/:classId (class teacher/admin)
export const getClassAttendance = async (req, res) => {
  const { classId } = req.params;
  await assertCanManageClass(req.user, classId);

  const { date } = req.query;
  const attendance = await prisma.attendance.findMany({
    where: { classId, ...(date && { date: dayRange(date) }) },
    include: { student: { include: { user: { select: { fullName: true, email: true } } } } },
    orderBy: { student: { user: { fullName: 'asc' } } },
  });

  res.json({ attendance });
};
