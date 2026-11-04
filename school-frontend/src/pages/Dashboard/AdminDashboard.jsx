import { Link } from 'react-router-dom';
import { LuCalendarCheck, LuChartColumn, LuGraduationCap, LuSchool, LuUserPlus } from 'react-icons/lu';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Card, CardHeader } from '../../components/ui/Card';
import AttendanceTrendChart from '../../components/charts/AttendanceTrendChart';
import RankedBars from '../../components/charts/RankedBars';
import { percent } from '../../lib/format';
import { ActivityFeed, UpcomingExams } from './widgets';
import { firstName, greeting, trendDescription } from './helpers';
import AtRiskCard from '../../components/insights/AtRiskCard';

const rateTone = (r) => (r == null ? 'neutral' : r >= 95 ? 'success' : r >= 90 ? 'primary' : 'warning');

const AdminDashboard = ({ data, user }) => {
  const { summary } = data;
  return (
    <>
      <PageHeader
        eyebrow={greeting()}
        title={`Welcome back, ${firstName(user.fullName)}`}
        description="Here's how your school is doing this week."
        actions={
          !user.isDemo && (
            <Button to="/teachers" icon={LuUserPlus}>
              Add teacher
            </Button>
          )
        }
      />

      <section aria-label="Key figures" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students" value={summary.totalStudents} icon={LuGraduationCap} hint={`${summary.totalParents} parents linked`} />
        <StatCard label="Classes" value={summary.totalClasses} icon={LuSchool} hint={`${summary.totalTeachers} teachers · ${summary.totalSubjects} subjects`} />
        <StatCard
          label="Attendance (14 days)"
          value={percent(summary.attendanceRate, 1)}
          icon={LuCalendarCheck}
          delta={summary.attendanceDelta}
          deltaLabel=" pts"
          hint="vs. previous 14 days"
        />
        <StatCard label="Average grade (8 weeks)" value={percent(summary.averageGrade, 1)} icon={LuChartColumn} hint="Across all graded exams" />
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AttendanceTrendChart
            title="School attendance"
            description={trendDescription(data.attendanceTrend)}
            series={[{ key: 'school', name: 'All classes', data: data.attendanceTrend }]}
          />
        </div>
        <ActivityFeed items={data.activity} />
      </div>

      <div className="mt-6">
        <AtRiskCard />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Classes at a glance"
            description="Attendance and average marks over the last 8 weeks"
            actions={
              <Link to="/classes" className="rounded text-sm font-semibold text-primary-ink hover:underline">
                Manage classes
              </Link>
            }
          />
          <div className="relative overflow-x-auto rounded-b-xl focus-visible:outline-offset-[-2px]" role="region" aria-label={'Classes at a glance'} tabIndex={0}>
            <table className="w-full min-w-[32rem] text-left text-sm">
              <caption className="sr-only">Classes at a glance</caption>
              <thead className="bg-surface-muted/60 text-xs uppercase tracking-wide text-ink-subtle">
                <tr>
                  <th scope="col" className="px-5 py-2.5 font-semibold">Class</th>
                  <th scope="col" className="px-5 py-2.5 font-semibold">Teacher</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-semibold">Students</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-semibold">Attendance</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-semibold">Avg. grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.classes.map((c) => (
                  <tr key={c.id}>
                    <td className="px-5 py-3 font-semibold text-ink">{c.name}</td>
                    <td className="px-5 py-3 text-ink-muted">{c.teacherName ?? <span className="text-ink-subtle">Unassigned</span>}</td>
                    <td className="px-5 py-3 text-right text-ink-muted tabular">{c.students}</td>
                    <td className="px-5 py-3 text-right">
                      <Badge tone={rateTone(c.attendanceRate)}>{percent(c.attendanceRate, 1)}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-ink tabular">{percent(c.averageGrade, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <UpcomingExams exams={data.upcomingExams} />
      </div>

      <div className="mt-6">
        <RankedBars
          title="Average marks by subject"
          description="All classes, last 8 weeks"
          items={data.subjectAverages.map((s) => ({ label: s.subject, value: s.average, hint: `${s.count} grades` }))}
          valueLabel={(v) => `${v}%`}
        />
      </div>
    </>
  );
};

export default AdminDashboard;
