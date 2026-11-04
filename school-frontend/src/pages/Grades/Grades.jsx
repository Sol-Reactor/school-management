import { useMemo, useState } from 'react';
import { LuCalendarPlus, LuChartColumn, LuClipboardList, LuUsers } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useApi } from '../../hooks/useApi';
import { classesApi, examsApi, gradesApi } from '../../services/schoolService';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import StatCard from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Field';
import RankedBars from '../../components/charts/RankedBars';
import { formatDate, gradeBand, percent } from '../../lib/format';
import { average, subjectAverages } from '../../lib/stats';
import { cn } from '../../lib/cn';
import Gradebook from './Gradebook';
import CreateExamDialog from './CreateExamDialog';

// ---------- Staff: exams → gradebook ----------
const StaffGrades = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const exams = useApi(() => examsApi.list(), []);
  const classes = useApi(() => classesApi.list(), []);
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [open, setOpen] = useState(null);
  const [creating, setCreating] = useState(false);
  const now = new Date();

  const rows = useMemo(
    () =>
      (exams.data?.exams ?? []).filter(
        (e) =>
          (!classFilter || e.class.id === classFilter) &&
          (!statusFilter || (statusFilter === 'upcoming' ? new Date(e.date) > now : new Date(e.date) <= now))
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `now` is stable enough for filtering
    [exams.data, classFilter, statusFilter]
  );

  const columns = [
    { id: 'date', header: 'Date', sortValue: (e) => new Date(e.date), cell: (e) => <span className="whitespace-nowrap">{formatDate(e.date)}</span> },
    {
      id: 'exam',
      header: 'Exam',
      sortValue: (e) => `${e.subject.name} ${e.name}`,
      cell: (e) => (
        <div>
          <p className="font-semibold text-ink">{e.subject.name}</p>
          <p className="text-xs text-ink-subtle">{e.name}</p>
        </div>
      ),
    },
    { id: 'class', header: 'Class', sortValue: (e) => e.class.name, cell: (e) => <Badge tone="primary">{e.class.name}</Badge> },
    {
      id: 'status',
      header: 'Status',
      hideBelow: 'sm',
      sortValue: (e) => e._count.grades,
      cell: (e) =>
        new Date(e.date) > now ? <Badge tone="info">Upcoming</Badge> : e._count.grades ? <Badge tone="success">{e._count.grades} graded</Badge> : <Badge tone="warning">Needs marks</Badge>,
    },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      cell: (e) => (
        <Button variant="secondary" size="sm" onClick={() => setOpen(e)}>
          Gradebook<span className="sr-only"> for {e.subject.name} {e.name}, {e.class.name}</span>
        </Button>
      ),
    },
  ];

  const classList = classes.data?.classes ?? [];

  return (
    <>
      <PageHeader
        title="Grades"
        description="Open an exam's gradebook to review or enter marks."
        actions={!user.isDemo && classList.length > 0 && <Button icon={LuCalendarPlus} onClick={() => setCreating(true)}>Schedule exam</Button>}
      />
      <DataTable
        caption="Exams"
        columns={columns}
        rows={rows}
        loading={exams.loading && !exams.data}
        error={exams.error}
        onRetry={exams.refetch}
        searchText={(e) => `${e.subject.name} ${e.name} ${e.class.name}`}
        searchPlaceholder="Search subject, exam or class"
        initialSort={{ id: 'date', dir: 'desc' }}
        toolbar={
          <>
            <label htmlFor="grades-class" className="sr-only">Filter by class</label>
            <Select id="grades-class" value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="w-full sm:w-40">
              <option value="">All classes</option>
              {classList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <label htmlFor="grades-status" className="sr-only">Filter by status</label>
            <Select id="grades-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-40">
              <option value="">Any status</option>
              <option value="past">Taken</option>
              <option value="upcoming">Upcoming</option>
            </Select>
          </>
        }
        emptyState={
          <EmptyState
            icon={LuClipboardList}
            title="No exams yet"
            description="Schedule an exam to start recording marks."
            action={!user.isDemo && classList.length > 0 && <Button icon={LuCalendarPlus} onClick={() => setCreating(true)}>Schedule exam</Button>}
          />
        }
      />
      {open && <Gradebook exam={open} onClose={() => setOpen(null)} onSaved={exams.refetch} />}
      {creating && (
        <CreateExamDialog
          classes={classList}
          onClose={() => setCreating(false)}
          onCreated={(exam) => {
            setCreating(false);
            showToast(`${exam.subject.name} · ${exam.name} scheduled.`);
            exams.refetch();
          }}
        />
      )}
    </>
  );
};

// ---------- Student / parent: read-only marks ----------
const StudentGrades = ({ studentId }) => {
  const { data, loading, error, refetch } = useApi(() => gradesApi.forStudent(studentId), [studentId]);
  const grades = useMemo(() => data?.grades ?? [], [data]);
  const bySubject = subjectAverages(grades);
  const latest = grades[0];

  const columns = [
    { id: 'date', header: 'Date', sortValue: (g) => new Date(g.exam.date), cell: (g) => <span className="whitespace-nowrap">{formatDate(g.exam.date)}</span> },
    { id: 'subject', header: 'Subject', sortValue: (g) => g.subject.name, cell: (g) => <span className="font-semibold text-ink">{g.subject.name}</span> },
    { id: 'exam', header: 'Assessment', hideBelow: 'sm', sortValue: (g) => g.exam.name, cell: (g) => g.exam.name },
    {
      id: 'marks',
      header: 'Marks',
      align: 'right',
      sortValue: (g) => g.marks,
      cell: (g) => {
        const b = gradeBand(g.marks);
        return (
          <span className="inline-flex items-center gap-2">
            <span className="font-semibold text-ink tabular">{g.marks}%</span>
            <Badge tone={b.tone} className="w-8 justify-center">{b.label}</Badge>
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <section aria-label="Key figures" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Overall average" value={percent(average(grades.map((g) => g.marks)), 1)} icon={LuChartColumn} hint={`${grades.length} assessments`} />
        <StatCard label="Strongest subject" value={bySubject[0]?.subject ?? '—'} hint={bySubject[0] && `${bySubject[0].average}% average`} />
        <StatCard label="Latest result" value={latest ? `${latest.marks}%` : '—'} hint={latest && `${latest.subject.name} · ${latest.exam.name}`} />
      </section>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <RankedBars title="Average by subject" items={bySubject.map((s) => ({ label: s.subject, value: s.average, hint: `${s.count} assessments` }))} valueLabel={(v) => `${v}%`} emptyText="No graded work yet." />
        <div className="lg:col-span-2">
          <DataTable
            caption="All grades"
            columns={columns}
            rows={grades}
            loading={loading && !data}
            error={error}
            onRetry={refetch}
            initialSort={{ id: 'date', dir: 'desc' }}
            searchText={(g) => `${g.subject.name} ${g.exam.name}`}
            searchPlaceholder="Search subject or assessment"
            emptyState={<EmptyState icon={LuChartColumn} title="No grades yet" description="Marks appear here once teachers grade an exam." />}
          />
        </div>
      </div>
    </div>
  );
};

const ParentGrades = () => {
  const { user } = useAuth();
  const children = user.parent?.students ?? [];
  const [active, setActive] = useState(children[0]?.id);
  if (!children.length) return <Card><EmptyState icon={LuUsers} title="No children linked yet" /></Card>;
  return (
    <>
      {children.length > 1 && (
        <div role="tablist" aria-label="Choose a child" className="mb-6 inline-flex rounded-xl border border-line bg-surface p-1">
          {children.map((c) => (
            <button
              key={c.id}
              role="tab"
              type="button"
              aria-selected={c.id === active}
              onClick={() => setActive(c.id)}
              className={cn('h-9 cursor-pointer rounded-lg px-4 text-sm font-semibold transition-colors duration-fast', c.id === active ? 'bg-primary text-primary-on' : 'text-ink-muted hover:text-ink')}
            >
              {c.user.fullName.split(' ')[0]}
            </button>
          ))}
        </div>
      )}
      <div role="tabpanel">
        <StudentGrades key={active} studentId={active} />
      </div>
    </>
  );
};

const Grades = () => {
  const { user } = useAuth();
  if (user.role === 'STUDENT') {
    return (
      <>
        <PageHeader title="My grades" description="Every graded assessment this term." />
        <StudentGrades studentId={user.student?.id} />
      </>
    );
  }
  if (user.role === 'PARENT') {
    return (
      <>
        <PageHeader title="Grades" description="Your children's marks this term." />
        <ParentGrades />
      </>
    );
  }
  return <StaffGrades />;
};

export default Grades;
