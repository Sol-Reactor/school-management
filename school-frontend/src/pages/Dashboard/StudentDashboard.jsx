import { LuBookOpen, LuCalendarCheck, LuCalendarClock, LuChartColumn, LuSchool } from 'react-icons/lu';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import AttendanceTrendChart from '../../components/charts/AttendanceTrendChart';
import AttendanceBreakdown from '../../components/charts/AttendanceBreakdown';
import RankedBars from '../../components/charts/RankedBars';
import { percent } from '../../lib/format';
import { RecentGrades, TodaysLessons, UpcomingExams } from './widgets';
import { firstName, greeting, trendDescription } from './helpers';

const StudentDashboard = ({ data, user }) => {
  const { summary, studentInfo } = data;
  const counts = Object.fromEntries(data.attendance.map((a) => [a.status, a._count.status]));

  if (!summary.hasClass) {
    return (
      <>
        <PageHeader eyebrow={greeting()} title={`Welcome, ${firstName(user.fullName)}`} />
        <Card>
          <EmptyState
            icon={LuSchool}
            title="You're not in a class yet"
            description="Once your school adds you to a class, your timetable, grades and attendance will appear here."
          />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={greeting()}
        title={`Hi ${firstName(user.fullName)}, here's your week`}
        description={`${studentInfo.class.name}${studentInfo.class.teacher ? ` · Class teacher ${studentInfo.class.teacher.user.fullName}` : ''}`}
      />

      <section aria-label="Key figures" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Attendance (14 days)"
          value={percent(summary.attendanceRate, 0)}
          icon={LuCalendarCheck}
          delta={summary.attendanceDelta}
          deltaLabel=" pts"
          hint="vs. previous 14 days"
        />
        <StatCard label="Average grade" value={percent(summary.averageGrade, 1)} icon={LuChartColumn} hint="All graded exams" />
        <StatCard label="Subjects" value={summary.totalSubjects} icon={LuBookOpen} />
        <StatCard label="Upcoming exams" value={summary.upcomingExams} icon={LuCalendarClock} />
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AttendanceTrendChart title="My attendance" description={trendDescription(data.attendanceTrend)} series={[{ key: 'me', name: 'You', data: data.attendanceTrend }]} />
        </div>
        <TodaysLessons lessons={data.todaysLessons} showTeacher />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <RankedBars
          title="My subject averages"
          items={data.subjectAverages.map((s) => ({ label: s.subject, value: s.average, hint: `${s.count} assessments` }))}
          valueLabel={(v) => `${v}%`}
        />
        <RecentGrades grades={data.recentGrades} />
        <UpcomingExams exams={data.upcomingExams} showClass={false} />
      </div>

      <Card className="mt-6">
        <CardHeader title="Attendance breakdown" description="All recorded sessions this term" />
        <CardBody>
          <AttendanceBreakdown counts={counts} />
        </CardBody>
      </Card>
    </>
  );
};

export default StudentDashboard;
