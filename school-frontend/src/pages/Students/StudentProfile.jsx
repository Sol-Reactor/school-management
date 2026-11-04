import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LuCalendarCheck, LuChartColumn, LuLock, LuMail, LuUserRound } from 'react-icons/lu';
import { useApi } from '../../hooks/useApi';
import { attendanceApi, studentsApi } from '../../services/schoolService';
import { useSetBreadcrumb } from '../../components/layout/breadcrumbStore';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import { Skeleton, StatCardSkeleton } from '../../components/ui/Skeleton';
import AttendanceTrendChart from '../../components/charts/AttendanceTrendChart';
import AttendanceBreakdown from '../../components/charts/AttendanceBreakdown';
import { STATUS_META } from '../../lib/attendanceStatus';
import RankedBars from '../../components/charts/RankedBars';
import { formatDate, formatWeekday, gradeBand, percent } from '../../lib/format';
import { attendanceRate, average, subjectAverages, weeklyAttendance } from '../../lib/stats';
import ProgressSummaryCard from '../../components/insights/ProgressSummaryCard';

const ProfileSkeleton = () => (
  <div role="status" aria-live="polite">
    <span className="sr-only">Loading student…</span>
    <div className="card flex items-center gap-4 p-6">
      <Skeleton className="h-16 w-16 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>
  </div>
);

const StudentProfile = () => {
  const { id } = useParams();
  const student = useApi(() => studentsApi.get(id), [id]);
  const attendance = useApi(() => attendanceApi.forStudent(id), [id]);

  const s = student.data?.student;
  useSetBreadcrumb(s?.user.fullName);

  const records = useMemo(() => attendance.data?.attendance ?? [], [attendance.data]);
  const grades = useMemo(() => s?.grades ?? [], [s]);
  const [since] = useState(() => Date.now() - 14 * 864e5);
  const recent14 = useMemo(() => records.filter((r) => new Date(r.date).getTime() >= since), [records, since]);

  if (student.loading && !s) return <ProfileSkeleton />;
  if (student.error) {
    const denied = /access/i.test(student.error);
    return (
      <Card>
        <EmptyState
          icon={denied ? LuLock : LuUserRound}
          title={denied ? "You don't have access to this student" : "We couldn't load this student"}
          description={denied ? 'Students are visible to their teachers, their parent and school admins.' : student.error}
          action={<Button to="/dashboard" variant="secondary">Back to dashboard</Button>}
        />
      </Card>
    );
  }

  const counts = attendance.data?.summary ?? {};
  const gradeColumns = [
    { id: 'date', header: 'Date', sortValue: (g) => new Date(g.exam.date), cell: (g) => formatDate(g.exam.date) },
    { id: 'subject', header: 'Subject', sortValue: (g) => g.subject.name, cell: (g) => <span className="font-medium text-ink">{g.subject.name}</span> },
    { id: 'exam', header: 'Assessment', hideBelow: 'sm', sortValue: (g) => g.exam.name, cell: (g) => g.exam.name },
    {
      id: 'marks',
      header: 'Marks',
      align: 'right',
      sortValue: (g) => g.marks,
      cell: (g) => {
        const band = gradeBand(g.marks);
        return (
          <span className="inline-flex items-center gap-2">
            <span className="font-semibold text-ink tabular">{g.marks}%</span>
            <Badge tone={band.tone} className="w-8 justify-center">{band.label}</Badge>
          </span>
        );
      },
    },
  ];

  return (
    <>
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar name={s.user.fullName} size="lg" decorative />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-ink">{s.user.fullName}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
              {s.class ? <Badge tone="primary">{s.class.name}</Badge> : <Badge>No class</Badge>}
              <span className="inline-flex items-center gap-1.5">
                <LuMail aria-hidden="true" className="h-4 w-4" />
                {s.user.email}
              </span>
              {s.class?.teacher && <span>Class teacher: {s.class.teacher.user.fullName}</span>}
              {s.parent && <span>Parent: {s.parent.user.fullName}</span>}
            </div>
          </div>
        </div>
      </Card>

      <section aria-label="Key figures" className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Attendance (14 days)" value={percent(attendanceRate(recent14), 0)} icon={LuCalendarCheck} hint={`${recent14.length} sessions`} />
        <StatCard label="Attendance (term)" value={percent(attendanceRate(records), 1)} icon={LuCalendarCheck} hint={`${records.length} sessions recorded`} />
        <StatCard label="Average grade" value={percent(average(grades.map((g) => g.marks)), 1)} icon={LuChartColumn} hint={`${grades.length} graded assessments`} />
      </section>

      <ProgressSummaryCard studentId={id} firstName={s.user.fullName.split(' ')[0]} />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AttendanceTrendChart title="Weekly attendance" series={[{ key: 's', name: s.user.fullName, data: weeklyAttendance(records) }]} />
        </div>
        <RankedBars
          title="Subject averages"
          items={subjectAverages(grades).map((x) => ({ label: x.subject, value: x.average, hint: `${x.count} assessments` }))}
          valueLabel={(v) => `${v}%`}
          emptyText="No graded work yet."
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-base font-semibold text-ink">Grades</h2>
          <DataTable
            caption={`Grades for ${s.user.fullName}`}
            columns={gradeColumns}
            rows={grades}
            initialSort={{ id: 'date', dir: 'desc' }}
            searchText={(g) => `${g.subject.name} ${g.exam.name}`}
            searchPlaceholder="Search subject or assessment"
            pageSize={8}
            emptyState={<EmptyState compact icon={LuChartColumn} title="No grades yet" />}
          />
        </div>
        <Card>
          <CardHeader title="Recent attendance" />
          <CardBody className="space-y-5">
            <AttendanceBreakdown counts={counts} />
            <ul className="divide-y divide-line border-t border-line">
              {records.slice(0, 8).map((r) => {
                const meta = STATUS_META[r.status];
                return (
                  <li key={r.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-ink-muted">{formatWeekday(r.date)}</span>
                    <Badge tone={meta.tone} icon={meta.icon}>{meta.label}</Badge>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>
      </div>
    </>
  );
};

export default StudentProfile;
