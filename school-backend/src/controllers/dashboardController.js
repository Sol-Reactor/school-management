// Role-specific dashboard data. Errors propagate to the central error handler.
//
// Response keys from earlier versions are kept; trend, delta and average fields
// are additive. Attendance rate = (present + late) / sessions.
import prisma from '../lib/prisma.js';
import { forbidden, notFound } from '../lib/errors.js';
import { demoClassFilter, demoProfileFilter, demoUserFilter } from '../lib/access.js';
import {
  attendanceRate,
  average,
  daysAgo,
  recentDelta,
  subjectAverages,
  todayName,
  weeklyAttendance,
} from '../lib/stats.js';

const TREND_WEEKS = 8;
const historyStart = () => daysAgo(TREND_WEEKS * 7);

const lessonSelect = {
  id: true,
  day: true,
  startTime: true,
  endTime: true,
  class: { select: { id: true, name: true } },
  subject: { select: { name: true } },
  teacher: { select: { user: { select: { fullName: true } } } },
};

const sortLessons = (a, b) => a.startTime.localeCompare(b.startTime);

const upcomingExamsQuery = (where, take = 5) =>
  prisma.exam.findMany({
    where: { ...where, date: { gte: daysAgo(0) } },
    select: {
      id: true,
      name: true,
      date: true,
      class: { select: { id: true, name: true } },
      subject: { select: { name: true } },
    },
    orderBy: { date: 'asc' },
    take,
  });

// ---------- ADMIN ----------
export const getAdminDashboard = async (req, res) => {
  const since = historyStart();
  // Demo admins only ever see the demo school.
  const u = demoUserFilter(req.user);
  const p = demoProfileFilter(req.user);
  const c = demoClassFilter(req.user);
  const [
    totalStudents,
    totalTeachers,
    totalParents,
    totalClasses,
    totalSubjects,
    recentUsers,
    recentEnrollments,
    attendance,
    grades,
    classes,
    upcomingExams,
    gradedExams,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT', ...u } }),
    prisma.user.count({ where: { role: 'TEACHER', ...u } }),
    prisma.user.count({ where: { role: 'PARENT', ...u } }),
    prisma.class.count({ where: c }),
    prisma.subject.count({ where: req.user.isDemo ? { class: c } : {} }),
    prisma.user.findMany({
      where: { createdAt: { gte: daysAgo(7) }, ...u },
      select: { id: true, fullName: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.enrollment.findMany({
      where: req.user.isDemo ? { student: p } : {},
      select: {
        id: true,
        createdAt: true,
        student: { select: { user: { select: { fullName: true } } } },
        class: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.attendance.findMany({
      where: { date: { gte: since }, ...(req.user.isDemo && { class: c }) },
      select: { date: true, status: true, classId: true },
    }),
    prisma.grade.findMany({
      where: { exam: { date: { gte: since }, ...(req.user.isDemo && { class: c }) } },
      select: { marks: true, subject: { select: { name: true } }, exam: { select: { classId: true } } },
    }),
    prisma.class.findMany({
      where: c,
      select: {
        id: true,
        name: true,
        level: true,
        teacher: { select: { user: { select: { fullName: true } } } },
        _count: { select: { students: true } },
      },
      orderBy: { name: 'asc' },
    }),
    upcomingExamsQuery(req.user.isDemo ? { class: c } : {}),
    prisma.exam.findMany({
      where: { date: { lte: new Date() }, grades: { some: {} }, ...(req.user.isDemo && { class: c }) },
      select: {
        id: true,
        name: true,
        date: true,
        class: { select: { name: true } },
        subject: { select: { name: true } },
        _count: { select: { grades: true } },
      },
      orderBy: { date: 'desc' },
      take: 5,
    }),
  ]);

  const delta = recentDelta(attendance);
  const classOverview = classes.map((c) => ({
    id: c.id,
    name: c.name,
    level: c.level,
    teacherName: c.teacher?.user.fullName ?? null,
    students: c._count.students,
    attendanceRate: attendanceRate(attendance.filter((a) => a.classId === c.id)),
    averageGrade: average(grades.filter((g) => g.exam.classId === c.id).map((g) => g.marks)),
  }));

  const activity = [
    ...recentEnrollments.slice(0, 5).map((e) => ({
      id: `enr-${e.id}`,
      type: 'ENROLLMENT',
      title: `${e.student.user.fullName} enrolled`,
      detail: e.class.name,
      at: e.createdAt,
    })),
    ...gradedExams.map((x) => ({
      id: `exam-${x.id}`,
      type: 'GRADES',
      title: `${x.subject.name} · ${x.name} graded`,
      detail: `${x.class.name} · ${x._count.grades} students`,
      at: x.date,
    })),
    ...recentUsers.slice(0, 5).map((u) => ({
      id: `user-${u.id}`,
      type: 'USER',
      title: `${u.fullName} joined`,
      detail: u.role.charAt(0) + u.role.slice(1).toLowerCase(),
      at: u.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 8);

  res.json({
    summary: {
      totalStudents,
      totalTeachers,
      totalParents,
      totalClasses,
      totalSubjects,
      attendanceRate: delta.current,
      attendanceDelta: delta.delta,
      averageGrade: average(grades.map((g) => g.marks)),
    },
    attendanceTrend: weeklyAttendance(attendance, TREND_WEEKS),
    classes: classOverview,
    subjectAverages: subjectAverages(grades),
    upcomingExams,
    activity,
    recentActivity: { newUsers: recentUsers, newEnrollments: recentEnrollments },
  });
};

// ---------- TEACHER ----------
export const getTeacherDashboard = async (req, res) => {
  const teacherId = req.user.teacher?.id;
  if (!teacherId) throw forbidden('Teacher profile not found.');

  const myClasses = await prisma.class.findMany({
    where: { teacherId },
    select: { id: true, name: true, level: true, _count: { select: { students: true } } },
    orderBy: { name: 'asc' },
  });
  const classIds = myClasses.map((c) => c.id);
  const since = historyStart();
  const today = daysAgo(0);

  const [totalStudents, upcomingExams, recentAttendance, timetable, attendance, grades, markedToday] = await Promise.all([
    prisma.student.count({ where: { classId: { in: classIds } } }),
    upcomingExamsQuery({ OR: [{ teacherId }, { classId: { in: classIds } }] }),
    prisma.attendance.findMany({
      where: { classId: { in: classIds } },
      select: {
        id: true,
        date: true,
        status: true,
        student: { select: { user: { select: { fullName: true } } } },
        class: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
      take: 5,
    }),
    prisma.timetable.findMany({ where: { teacherId }, select: lessonSelect }),
    prisma.attendance.findMany({ where: { classId: { in: classIds }, date: { gte: since } }, select: { date: true, status: true, classId: true } }),
    prisma.grade.findMany({
      where: { exam: { classId: { in: classIds }, date: { gte: since } } },
      select: { marks: true, subject: { select: { name: true } }, exam: { select: { classId: true } } },
    }),
    prisma.attendance.groupBy({ by: ['classId'], where: { classId: { in: classIds }, date: { gte: today } }, _count: true }),
  ]);

  const delta = recentDelta(attendance);
  const marked = new Set(markedToday.map((m) => m.classId));

  res.json({
    summary: {
      totalClasses: myClasses.length,
      totalStudents,
      upcomingExams: upcomingExams.length,
      attendanceRate: delta.current,
      attendanceDelta: delta.delta,
      averageGrade: average(grades.map((g) => g.marks)),
    },
    myClasses: myClasses.map((c) => ({
      ...c,
      attendanceRate: attendanceRate(attendance.filter((a) => a.classId === c.id)),
      averageGrade: average(grades.filter((g) => g.exam.classId === c.id).map((g) => g.marks)),
      attendanceMarkedToday: marked.has(c.id),
    })),
    attendanceTrend: weeklyAttendance(attendance, TREND_WEEKS),
    todaysLessons: timetable.filter((t) => t.day === todayName()).sort(sortLessons),
    upcomingExams,
    recentAttendance,
    timetable,
  });
};

// ---------- STUDENT ----------
export const getStudentDashboard = async (req, res) => {
  const studentId = req.user.student?.id;
  if (!studentId) throw forbidden('Student profile not found.');

  const studentInfo = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      classId: true,
      user: { select: { fullName: true, email: true } },
      class: {
        select: { id: true, name: true, level: true, teacher: { select: { user: { select: { fullName: true } } } } },
      },
      parent: { select: { user: { select: { fullName: true, email: true } } } },
    },
  });
  if (!studentInfo) throw notFound('Student not found');

  const hasClass = !!studentInfo.classId;
  const [attendanceSummary, recentGrades, upcomingExams, timetable, classInfo, attendance, allGrades] = await Promise.all([
    prisma.attendance.groupBy({ by: ['status'], where: { studentId }, _count: { status: true } }),
    prisma.grade.findMany({
      where: { studentId },
      select: { id: true, marks: true, exam: { select: { name: true, date: true } }, subject: { select: { name: true } } },
      orderBy: { exam: { date: 'desc' } },
      take: 5,
    }),
    hasClass ? upcomingExamsQuery({ classId: studentInfo.classId }) : [],
    hasClass ? prisma.timetable.findMany({ where: { classId: studentInfo.classId }, select: lessonSelect }) : [],
    hasClass
      ? prisma.class.findUnique({ where: { id: studentInfo.classId }, select: { subjects: { select: { id: true, name: true, code: true } } } })
      : { subjects: [] },
    prisma.attendance.findMany({ where: { studentId, date: { gte: historyStart() } }, select: { date: true, status: true } }),
    prisma.grade.findMany({ where: { studentId }, select: { marks: true, subject: { select: { name: true } } } }),
  ]);

  const total = attendanceSummary.reduce((s, a) => s + a._count.status, 0);
  const present = attendanceSummary.find((a) => a.status === 'PRESENT')?._count.status || 0;
  const delta = recentDelta(attendance);

  res.json({
    studentInfo,
    summary: {
      attendancePercentage: total ? Math.round((present / total) * 100) : 0,
      attendanceRate: delta.current,
      attendanceDelta: delta.delta,
      averageGrade: average(allGrades.map((g) => g.marks)),
      totalSubjects: classInfo?.subjects?.length || 0,
      upcomingExams: upcomingExams.length,
      hasClass,
    },
    attendance: attendanceSummary,
    attendanceTrend: weeklyAttendance(attendance, TREND_WEEKS),
    subjectAverages: subjectAverages(allGrades),
    recentGrades,
    upcomingExams,
    todaysLessons: timetable.filter((t) => t.day === todayName()).sort(sortLessons),
    timetable,
    subjects: classInfo?.subjects || [],
  });
};

// ---------- PARENT ----------
export const getParentDashboard = async (req, res) => {
  const parentId = req.user.parent?.id;
  if (!parentId) throw forbidden('Parent profile not found.');

  const children = await prisma.student.findMany({
    where: { parentId },
    select: {
      id: true,
      classId: true,
      user: { select: { fullName: true, email: true } },
      class: { select: { name: true, level: true } },
    },
    orderBy: { user: { fullName: 'asc' } },
  });
  const childIds = children.map((c) => c.id);
  const classIds = children.map((c) => c.classId).filter(Boolean);

  const [parentInfo, attendance, childrenGrades, upcomingExams, allGrades] = await Promise.all([
    prisma.parent.findUnique({ where: { id: parentId }, select: { user: { select: { fullName: true, email: true } } } }),
    prisma.attendance.findMany({
      where: { studentId: { in: childIds }, date: { gte: historyStart() } },
      select: { studentId: true, date: true, status: true },
    }),
    prisma.grade.findMany({
      where: { studentId: { in: childIds } },
      select: {
        id: true,
        marks: true,
        student: { select: { id: true, user: { select: { fullName: true } } } },
        exam: { select: { name: true, date: true } },
        subject: { select: { name: true } },
      },
      orderBy: { exam: { date: 'desc' } },
      take: 10,
    }),
    classIds.length ? upcomingExamsQuery({ classId: { in: classIds } }) : [],
    prisma.grade.findMany({ where: { studentId: { in: childIds } }, select: { studentId: true, marks: true } }),
  ]);

  const childrenWithStats = children.map((child) => {
    const records = attendance.filter((a) => a.studentId === child.id);
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const delta = recentDelta(records);
    return {
      ...child,
      attendancePercentage: records.length ? Math.round((present / records.length) * 100) : 0,
      attendanceRate: delta.current,
      attendanceDelta: delta.delta,
      averageGrade: average(allGrades.filter((g) => g.studentId === child.id).map((g) => g.marks)),
      attendanceTrend: weeklyAttendance(records, TREND_WEEKS),
    };
  });

  res.json({
    parentInfo,
    summary: { totalChildren: children.length, totalUpcomingExams: upcomingExams.length },
    children: childrenWithStats,
    recentGrades: childrenGrades,
    upcomingExams,
  });
};

// GET /api/dashboard
export const getDashboard = async (req, res) => {
  switch (req.user.role) {
    case 'ADMIN':
      return getAdminDashboard(req, res);
    case 'TEACHER':
      return getTeacherDashboard(req, res);
    case 'STUDENT':
      return getStudentDashboard(req, res);
    case 'PARENT':
      return getParentDashboard(req, res);
    default:
      throw forbidden('Unknown role');
  }
};
