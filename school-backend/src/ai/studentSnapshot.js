// Builds the *minimum* data the progress summary needs. This object is exactly
// what is sent to the model: a first name, class level, attendance figures,
// per-subject averages and recent results. It never contains emails, ids,
// parent details, teacher names or any other student.
import { createHash } from 'node:crypto';
import prisma from '../lib/prisma.js';
import { attendanceRate, average, daysAgo } from '../lib/stats.js';

const isoDay = (d) => new Date(d).toISOString().slice(0, 10);

const trendOf = (marks) => {
  if (marks.length < 3) return 'not enough data';
  const half = Math.floor(marks.length / 2);
  const early = average(marks.slice(0, half));
  const late = average(marks.slice(half));
  if (late - early >= 5) return 'improving';
  if (early - late >= 5) return 'declining';
  return 'steady';
};

export const MIN_DATA_POINTS = 5;

/** Returns { snapshot, dataPoints } or null when the student doesn't exist. */
export const buildStudentSnapshot = async (studentId, now = new Date()) => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      user: { select: { fullName: true } },
      class: { select: { level: true } },
      attendance: { select: { date: true, status: true }, where: { date: { lte: now } } },
      grades: {
        where: { exam: { date: { lte: now } } },
        select: { marks: true, subject: { select: { name: true } }, exam: { select: { name: true, date: true } } },
        orderBy: { exam: { date: 'asc' } },
      },
    },
  });
  if (!student) return null;

  const recent = student.attendance.filter((a) => a.date >= daysAgo(14, now));
  const previous = student.attendance.filter((a) => a.date < daysAgo(14, now) && a.date >= daysAgo(28, now));
  const count = (s) => student.attendance.filter((a) => a.status === s).length;

  const bySubject = new Map();
  for (const g of student.grades) {
    const list = bySubject.get(g.subject.name) ?? [];
    list.push(g.marks);
    bySubject.set(g.subject.name, list);
  }

  const snapshot = {
    firstName: student.user.fullName.split(' ')[0],
    classLevel: student.class?.level ?? null,
    attendance: {
      sessionsRecorded: student.attendance.length,
      termRatePercent: attendanceRate(student.attendance),
      last14DaysPercent: attendanceRate(recent),
      previous14DaysPercent: attendanceRate(previous),
      absences: count('ABSENT'),
      excusedAbsences: count('EXCUSED'),
      lateArrivals: count('LATE'),
    },
    overallAveragePercent: average(student.grades.map((g) => g.marks)),
    subjects: [...bySubject.entries()]
      .map(([subject, marks]) => ({
        subject,
        averagePercent: average(marks),
        latestPercent: marks.at(-1),
        assessments: marks.length,
        trend: trendOf(marks),
      }))
      .sort((a, b) => b.averagePercent - a.averagePercent),
    recentResults: student.grades
      .slice(-8)
      .reverse()
      .map((g) => ({ date: isoDay(g.exam.date), subject: g.subject.name, assessment: g.exam.name, marksPercent: g.marks })),
  };

  return { snapshot, dataPoints: student.attendance.length + student.grades.length, fullName: student.user.fullName };
};

/** Stable fingerprint of the inputs, so cached output is reused only for identical data. */
export const inputHash = (...parts) => createHash('sha256').update(JSON.stringify(parts)).digest('hex');
