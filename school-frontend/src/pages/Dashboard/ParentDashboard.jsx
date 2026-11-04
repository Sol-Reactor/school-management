import { Link } from 'react-router-dom';
import { LuArrowRight, LuUsers } from 'react-icons/lu';
import PageHeader from '../../components/ui/PageHeader';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import AttendanceTrendChart from '../../components/charts/AttendanceTrendChart';
import { percent } from '../../lib/format';
import { RecentGrades, UpcomingExams } from './widgets';
import { firstName, greeting } from './helpers';

const ChildCard = ({ child }) => {
  const d = child.attendanceDelta;
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <Avatar name={child.user.fullName} size="md" decorative />
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-ink">{child.user.fullName}</h2>
          <p className="text-sm text-ink-subtle">{child.class ? child.class.name : 'Not in a class yet'}</p>
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-surface-muted/60 p-3">
          <dt className="text-xs font-medium text-ink-muted">Attendance (14 days)</dt>
          <dd className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ink tabular">{percent(child.attendanceRate, 0)}</span>
            {d != null && d !== 0 && (
              <Badge tone={d > 0 ? 'success' : 'danger'}>
                {d > 0 ? '▲' : '▼'} {Math.abs(d)} pts<span className="sr-only">{d > 0 ? ' increase' : ' decrease'}</span>
              </Badge>
            )}
          </dd>
        </div>
        <div className="rounded-lg bg-surface-muted/60 p-3">
          <dt className="text-xs font-medium text-ink-muted">Average grade</dt>
          <dd className="mt-1 text-2xl font-bold text-ink tabular">{percent(child.averageGrade, 1)}</dd>
        </div>
      </dl>
      <Link
        to={`/students/${child.id}`}
        className="mt-4 inline-flex items-center gap-1 rounded text-sm font-semibold text-primary-ink hover:underline"
      >
        View {firstName(child.user.fullName)}'s progress
        <LuArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </Card>
  );
};

const ParentDashboard = ({ data, user }) => {
  if (data.children.length === 0) {
    return (
      <>
        <PageHeader eyebrow={greeting()} title={`Welcome, ${firstName(user.fullName)}`} />
        <Card>
          <EmptyState
            icon={LuUsers}
            title="No children linked yet"
            description="When your child registers, they can enter your email to link their account to yours."
          />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={greeting()}
        title={`Welcome back, ${firstName(user.fullName)}`}
        description={`Following ${data.children.map((c) => firstName(c.user.fullName)).join(' and ')} this term.`}
      />

      <section aria-label="Your children" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.children.map((c) => (
          <ChildCard key={c.id} child={c} />
        ))}
      </section>

      <div className="mt-6">
        <AttendanceTrendChart
          title="Weekly attendance"
          description="Share of sessions attended each week"
          series={data.children.map((c) => ({ key: c.id, name: firstName(c.user.fullName), data: c.attendanceTrend }))}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentGrades grades={data.recentGrades.slice(0, 6)} showStudent />
        <UpcomingExams exams={data.upcomingExams} />
      </div>
    </>
  );
};

export default ParentDashboard;
