import { Link } from 'react-router-dom';
import {
  LuCalendarClock,
  LuCalendarOff,
  LuChartColumn,
  LuClipboardCheck,
  LuSparkles,
  LuUserPlus,
} from 'react-icons/lu';
import { Card, CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { Skeleton, StatCardSkeleton } from '../../components/ui/Skeleton';
import { formatDate, gradeBand, relativeTime } from '../../lib/format';

const daysUntil = (date) => Math.round((new Date(date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 864e5);

export const UpcomingExams = ({ exams, showClass = true }) => (
  <Card>
    <CardHeader title="Upcoming exams" description="Next assessments on the calendar" />
    {exams.length === 0 ? (
      <EmptyState compact icon={LuCalendarOff} title="Nothing scheduled" description="New exams will show up here." />
    ) : (
      <ul className="divide-y divide-line">
        {exams.map((e) => {
          const d = daysUntil(e.date);
          return (
            <li key={e.id} className="flex items-center gap-3 px-5 py-3">
              <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-surface-muted text-center leading-none">
                <span className="text-[10px] font-semibold uppercase text-ink-subtle">
                  {new Intl.DateTimeFormat('en', { month: 'short' }).format(new Date(e.date))}
                </span>
                <span className="mt-0.5 text-base font-bold text-ink">{new Date(e.date).getUTCDate()}</span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {e.subject?.name} · {e.name}
                </p>
                {showClass && <p className="truncate text-xs text-ink-subtle">{e.class?.name}</p>}
              </div>
              <Badge tone={d <= 3 ? 'warning' : 'neutral'}>{d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : `In ${d} days`}</Badge>
            </li>
          );
        })}
      </ul>
    )}
  </Card>
);

export const TodaysLessons = ({ lessons, showTeacher = false }) => (
  <Card>
    <CardHeader
      title="Today's lessons"
      description={new Intl.DateTimeFormat('en', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
      actions={
        <Link to="/timetable" className="rounded text-sm font-semibold text-primary-ink hover:underline">
          Full timetable
        </Link>
      }
    />
    {lessons.length === 0 ? (
      <EmptyState compact icon={LuCalendarClock} title="No lessons today" description="Enjoy the break — check the timetable for the week ahead." />
    ) : (
      <ol className="divide-y divide-line">
        {lessons.map((l) => (
          <li key={l.id} className="flex items-center gap-4 px-5 py-3">
            <span className="w-24 shrink-0 text-sm font-semibold text-ink tabular">
              {l.startTime}
              <span className="font-normal text-ink-subtle">–{l.endTime}</span>
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{l.subject?.name}</p>
              <p className="truncate text-xs text-ink-subtle">
                {l.class?.name}
                {showTeacher && l.teacher?.user && ` · ${l.teacher.user.fullName}`}
              </p>
            </div>
          </li>
        ))}
      </ol>
    )}
  </Card>
);

const ACTIVITY_ICON = { ENROLLMENT: LuUserPlus, GRADES: LuChartColumn, USER: LuSparkles, ATTENDANCE: LuClipboardCheck };

export const ActivityFeed = ({ items }) => (
  <Card>
    <CardHeader title="Recent activity" description="Latest changes across the school" />
    {items.length === 0 ? (
      <EmptyState compact icon={LuSparkles} title="No recent activity" />
    ) : (
      <ol className="space-y-0 px-5 py-2">
        {items.map((a, i) => {
          const Icon = ACTIVITY_ICON[a.type] ?? LuSparkles;
          return (
            <li key={a.id} className="relative flex gap-3 py-2.5">
              {i < items.length - 1 && <span aria-hidden="true" className="absolute left-4 top-11 h-[calc(100%-2rem)] w-px bg-line" />}
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-ink">
                <Icon aria-hidden="true" className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{a.title}</p>
                <p className="text-xs text-ink-subtle">
                  {a.detail} · <time dateTime={a.at}>{relativeTime(a.at)}</time>
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    )}
  </Card>
);

export const RecentGrades = ({ grades, showStudent = false, title = 'Recent grades' }) => (
  <Card>
    <CardHeader
      title={title}
      actions={
        <Link to="/grades" className="rounded text-sm font-semibold text-primary-ink hover:underline">
          View all
        </Link>
      }
    />
    {grades.length === 0 ? (
      <EmptyState compact icon={LuChartColumn} title="No grades yet" description="Marks appear here once exams are graded." />
    ) : (
      <ul className="divide-y divide-line">
        {grades.map((g) => {
          const band = gradeBand(g.marks);
          return (
            <li key={g.id} className="flex items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {g.subject?.name} · {g.exam?.name}
                </p>
                <p className="truncate text-xs text-ink-subtle">
                  {showStudent && g.student?.user && `${g.student.user.fullName} · `}
                  {formatDate(g.exam?.date)}
                </p>
              </div>
              <span className="text-sm font-bold text-ink tabular">{g.marks}%</span>
              <Badge tone={band.tone} className="w-8 justify-center">
                {band.label}
              </Badge>
            </li>
          );
        })}
      </ul>
    )}
  </Card>
);

export const DashboardSkeleton = () => (
  <div role="status" aria-live="polite">
    <span className="sr-only">Loading dashboard…</span>
    <Skeleton className="mb-2 h-8 w-64" />
    <Skeleton className="mb-8 h-4 w-80" />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="card h-80 lg:col-span-2" />
      <div className="card h-80" />
    </div>
  </div>
);
