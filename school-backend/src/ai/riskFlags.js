// At-risk flags, computed with plain SQL. No AI is involved in deciding who is
// flagged; the model is only used afterwards to explain a flag in words.
//
// Rules (all over completed sessions and exams):
//   LOW_ATTENDANCE   attendance in the last 21 days below 85% (at least 5 sessions)
//   ATTENDANCE_DROP  last-21-day rate at least 10 points below the 5 weeks before
//   GRADE_DROP       average of exams in the last 21 days at least 8 points below
//                    the average of earlier exams (at least 2 grades in each)
//   LOW_GRADES       average of exams in the last 21 days below 50
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { studentScope } from '../lib/access.js';
import { daysAgo } from '../lib/stats.js';

export const RULES = {
  recentDays: 21,
  baselineDays: 56, // recent window + 5 weeks before it
  lowAttendance: 85,
  attendanceDrop: 10,
  gradeDrop: 8,
  lowGrades: 50,
  minSessions: 5,
  minGrades: 2,
};

const round1 = (n) => (n == null ? null : Math.round(Number(n) * 10) / 10);
const pct = (attended, total) => (Number(total) > 0 ? round1((Number(attended) / Number(total)) * 100) : null);

/** Aggregates per student in one round trip each for attendance and grades. */
const aggregate = async (studentIds, now = new Date()) => {
  if (studentIds.length === 0) return { attendance: new Map(), grades: new Map() };
  const recent = daysAgo(RULES.recentDays, now);
  const start = daysAgo(RULES.baselineDays, now);
  const ids = Prisma.join(studentIds);

  const attendanceRows = await prisma.$queryRaw`
    SELECT "studentId",
           COUNT(*) FILTER (WHERE "date" >= ${recent})                                           AS recent_total,
           COUNT(*) FILTER (WHERE "date" >= ${recent} AND "status"::text IN ('PRESENT', 'LATE')) AS recent_attended,
           COUNT(*) FILTER (WHERE "date" <  ${recent})                                           AS prev_total,
           COUNT(*) FILTER (WHERE "date" <  ${recent} AND "status"::text IN ('PRESENT', 'LATE')) AS prev_attended
    FROM "Attendance"
    WHERE "studentId" IN (${ids}) AND "date" >= ${start} AND "date" <= ${now}
    GROUP BY "studentId"`;

  const gradeRows = await prisma.$queryRaw`
    SELECT g."studentId",
           AVG(g."marks") FILTER (WHERE e."date" >= ${recent})   AS recent_avg,
           COUNT(*)       FILTER (WHERE e."date" >= ${recent})   AS recent_n,
           AVG(g."marks") FILTER (WHERE e."date" <  ${recent})   AS prev_avg,
           COUNT(*)       FILTER (WHERE e."date" <  ${recent})   AS prev_n
    FROM "Grade" g
    JOIN "Exam" e ON e."id" = g."examId"
    WHERE g."studentId" IN (${ids}) AND e."date" <= ${now}
    GROUP BY g."studentId"`;

  return {
    attendance: new Map(attendanceRows.map((r) => [r.studentId, r])),
    grades: new Map(gradeRows.map((r) => [r.studentId, r])),
  };
};

/** Applies the rules to one student's aggregates. Pure, so it's easy to unit test. */
export const evaluateFlags = (att, grd) => {
  const flags = [];
  const recentRate = att ? pct(att.recent_attended, att.recent_total) : null;
  const prevRate = att ? pct(att.prev_attended, att.prev_total) : null;
  const recentSessions = Number(att?.recent_total ?? 0);

  if (recentRate != null && recentSessions >= RULES.minSessions && recentRate < RULES.lowAttendance) {
    flags.push({
      code: 'LOW_ATTENDANCE',
      label: 'Low attendance',
      detail: `${recentRate}% of sessions attended in the last ${RULES.recentDays} days (threshold ${RULES.lowAttendance}%)`,
      value: recentRate,
    });
  }
  if (recentRate != null && prevRate != null && recentSessions >= RULES.minSessions && prevRate - recentRate >= RULES.attendanceDrop) {
    flags.push({
      code: 'ATTENDANCE_DROP',
      label: 'Attendance dropping',
      detail: `attendance fell from ${prevRate}% to ${recentRate}% (down ${round1(prevRate - recentRate)} points)`,
      value: round1(recentRate - prevRate),
    });
  }

  const recentAvg = grd && Number(grd.recent_n) >= RULES.minGrades ? round1(grd.recent_avg) : null;
  const prevAvg = grd && Number(grd.prev_n) >= RULES.minGrades ? round1(grd.prev_avg) : null;
  if (recentAvg != null && prevAvg != null && prevAvg - recentAvg >= RULES.gradeDrop) {
    flags.push({
      code: 'GRADE_DROP',
      label: 'Marks dropping',
      detail: `recent exam average ${recentAvg}% vs ${prevAvg}% earlier in the term (down ${round1(prevAvg - recentAvg)} points)`,
      value: round1(recentAvg - prevAvg),
    });
  }
  if (recentAvg != null && recentAvg < RULES.lowGrades) {
    flags.push({
      code: 'LOW_GRADES',
      label: 'Low recent marks',
      detail: `recent exam average ${recentAvg}% (threshold ${RULES.lowGrades}%)`,
      value: recentAvg,
    });
  }

  return { flags, metrics: { recentRate, prevRate, recentAvg, prevAvg } };
};

/**
 * Flagged students visible to `user` (teachers: their students; admins: everyone,
 * demo admins: the demo school), most serious first.
 */
export const findAtRiskStudents = async (user, { studentId } = {}) => {
  const students = await prisma.student.findMany({
    where: { AND: [studentScope(user), studentId ? { id: studentId } : {}] },
    select: { id: true, user: { select: { fullName: true } }, class: { select: { name: true, level: true } } },
  });
  const { attendance, grades } = await aggregate(students.map((s) => s.id));

  return students
    .map((s) => {
      const { flags, metrics } = evaluateFlags(attendance.get(s.id), grades.get(s.id));
      return {
        studentId: s.id,
        fullName: s.user.fullName,
        className: s.class?.name ?? null,
        classLevel: s.class?.level ?? null,
        flags,
        metrics,
        severity: flags.length >= 2 ? 'high' : flags.length === 1 ? 'medium' : 'none',
      };
    })
    .filter((s) => s.flags.length > 0)
    .sort((a, b) => b.flags.length - a.flags.length || (a.metrics.recentRate ?? 100) - (b.metrics.recentRate ?? 100));
};
