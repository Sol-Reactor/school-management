import { Link } from 'react-router-dom';
import { LuCalendarCheck, LuChartColumn, LuCircleAlert, LuCircleCheck, LuGraduationCap, LuSchool } from 'react-icons/lu';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { Card, CardHeader } from '../../components/ui/Card';
import AttendanceTrendChart from '../../components/charts/AttendanceTrendChart';
import { percent } from '../../lib/format';
import { TodaysLessons, UpcomingExams } from './widgets';
import { firstName, greeting, trendDescription } from './helpers';

const TeacherDashboard = ({ data, user }) => {
  const { summary } = data;
  const unmarked = data.myClasses.filter((c) => !c.attendanceMarkedToday);

  return (
    <>
      <PageHeader
        eyebrow={greeting()}
        title={`Welcome back, ${firstName(user.fullName)}`}
        description={
          unmarked.length
            ? `${unmarked.length} of your classes still need today's register.`
            : "All of today's registers are done. Nice work."
        }
        actions={
          <Button to="/attendance" icon={LuCalendarCheck}>
            Take attendance
          </Button>
        }
      />

      <section aria-label="Key figures" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="My classes" value={summary.totalClasses} icon={LuSchool} />
        <StatCard label="Students" value={summary.totalStudents} icon={LuGraduationCap} />
        <StatCard
          label="Attendance (14 days)"
          value={percent(summary.attendanceRate, 1)}
          icon={LuCalendarCheck}
          delta={summary.attendanceDelta}
          deltaLabel=" pts"
          hint="vs. previous 14 days"
        />
        <StatCard label="Average grade" value={percent(summary.averageGrade, 1)} icon={LuChartColumn} hint="Your classes, last 8 weeks" />
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AttendanceTrendChart
            title="Attendance in my classes"
            description={trendDescription(data.attendanceTrend)}
            series={[{ key: 'mine', name: 'My classes', data: data.attendanceTrend }]}
          />
        </div>
        <TodaysLessons lessons={data.todaysLessons} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="My classes" description="Today's register status and 8-week averages" />
          {data.myClasses.length === 0 ? (
            <EmptyState compact icon={LuSchool} title="No classes yet" description="Ask an administrator to assign you a class, or create one." action={<Button to="/classes" variant="secondary">Go to classes</Button>} />
          ) : (
            <ul className="divide-y divide-line">
              {data.myClasses.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{c.name}</p>
                    <p className="text-xs text-ink-subtle">
                      {c._count.students} students · attendance {percent(c.attendanceRate, 1)} · avg {percent(c.averageGrade, 1)}
                    </p>
                  </div>
                  {c.attendanceMarkedToday ? (
                    <Badge tone="success" icon={LuCircleCheck}>Register done</Badge>
                  ) : (
                    <>
                      <Badge tone="warning" icon={LuCircleAlert}>Register pending</Badge>
                      <Link to={`/attendance?class=${c.id}`} className="rounded text-sm font-semibold text-primary-ink hover:underline">
                        Take register<span className="sr-only"> for {c.name}</span>
                      </Link>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <UpcomingExams exams={data.upcomingExams} />
      </div>
    </>
  );
};

export default TeacherDashboard;
