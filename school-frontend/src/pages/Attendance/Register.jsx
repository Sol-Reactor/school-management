// Teacher/admin register: one row per student, a radio group per row.
import { useMemo, useState } from 'react';
import { LuCheckCheck, LuSave, LuUsers } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useApi } from '../../hooks/useApi';
import { attendanceApi, classesApi } from '../../services/schoolService';
import { getErrorMessage } from '../../services/api';
import { Card } from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { STATUS_META } from '../../lib/attendanceStatus';
import { cn } from '../../lib/cn';

const STATUSES = ['PRESENT', 'LATE', 'EXCUSED', 'ABSENT'];

const selectedTone = {
  PRESENT: 'border-success bg-success-soft text-success',
  LATE: 'border-warning bg-warning-soft text-warning',
  EXCUSED: 'border-info bg-info-soft text-info',
  ABSENT: 'border-danger bg-danger-soft text-danger',
};

const Register = ({ classId, date }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const roster = useApi(() => classesApi.students(classId), [classId]);
  const existing = useApi(() => attendanceApi.forClass(classId, { date }), [classId, date]);
  // Only local edits are kept in state; the saved register comes from the API.
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(false);

  const saved = useMemo(
    () => Object.fromEntries((existing.data?.attendance ?? []).map((a) => [a.studentId, a])),
    [existing.data]
  );

  const students = roster.data?.students ?? [];
  const marks = Object.fromEntries(students.map((s) => [s.id, edits[s.id] ?? saved[s.id]?.status]));
  const changed = students.filter((s) => marks[s.id] && marks[s.id] !== saved[s.id]?.status);
  const unmarked = students.filter((s) => !marks[s.id]).length;
  const counts = STATUSES.map((k) => [k, students.filter((s) => marks[s.id] === k).length]);

  const save = async () => {
    setSaving(true);
    try {
      await Promise.all(
        changed.map((s) =>
          saved[s.id]
            ? attendanceApi.update(saved[s.id].id, marks[s.id])
            : attendanceApi.mark({ studentId: s.id, classId, date, status: marks[s.id] })
        )
      );
      showToast(`Register saved · ${changed.length} ${changed.length === 1 ? 'student' : 'students'} updated.`);
      setEdits({});
      existing.refetch();
    } catch (error) {
      showToast(getErrorMessage(error, 'Some records could not be saved.'), 'error');
      existing.refetch();
    } finally {
      setSaving(false);
    }
  };

  if ((roster.loading && !roster.data) || (existing.loading && !existing.data)) {
    return (
      <Card role="status" aria-live="polite">
        <span className="sr-only">Loading register…</span>
        <TableSkeleton rows={8} columns={4} />
      </Card>
    );
  }
  if (roster.error) {
    return <Card><EmptyState title="Couldn't load this class" description={roster.error} action={<Button variant="secondary" onClick={roster.refetch}>Try again</Button>} /></Card>;
  }
  if (students.length === 0) {
    return <Card><EmptyState icon={LuUsers} title="No students in this class" description="Add students from the Classes page first." /></Card>;
  }

  const readOnly = user.isDemo;

  return (
    <Card>
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted" aria-live="polite">
          {counts.map(([k, n]) => (
            <span key={k}>
              {STATUS_META[k].label}: <strong className="font-semibold text-ink tabular">{n}</strong>
            </span>
          ))}
          {unmarked > 0 && <span className="text-warning">Unmarked: <strong className="font-semibold tabular">{unmarked}</strong></span>}
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={LuCheckCheck}
            disabled={readOnly}
            onClick={() => setEdits((e) => ({ ...Object.fromEntries(students.filter((s) => !marks[s.id]).map((s) => [s.id, 'PRESENT'])), ...e }))}
          >
            Mark rest present
          </Button>
          <Button size="sm" icon={LuSave} onClick={save} loading={saving} disabled={readOnly || changed.length === 0}>
            Save{changed.length > 0 && ` (${changed.length})`}
          </Button>
        </div>
      </div>
      {readOnly && (
        <p className="border-b border-line bg-accent-soft px-4 py-2 text-sm text-ink">Demo mode: you can try the register, but changes won't be saved.</p>
      )}
      <ul className="divide-y divide-line">
        {students.map((s) => (
          <li key={s.id}>
            <fieldset className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
              <legend className="sr-only">Attendance for {s.user.fullName}</legend>
              <div className="flex min-w-0 flex-1 items-center gap-3" aria-hidden="true">
                <Avatar name={s.user.fullName} size="sm" decorative />
                <span className="truncate text-sm font-semibold text-ink">{s.user.fullName}</span>
                {marks[s.id] && marks[s.id] !== saved[s.id]?.status && (
                  <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[11px] font-semibold text-primary-ink">Unsaved</span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-1.5 sm:flex">
                {STATUSES.map((k) => {
                  const Meta = STATUS_META[k];
                  const checked = marks[s.id] === k;
                  return (
                    <label
                      key={k}
                      className={cn(
                        'relative flex h-12 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border px-1 text-[11px] font-semibold transition-colors duration-fast has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/40 sm:h-10 sm:flex-row sm:gap-1.5 sm:px-3 sm:text-xs',
                        checked ? selectedTone[k] : 'border-line-input text-ink-muted hover:bg-surface-muted'
                      )}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        name={`att-${s.id}`}
                        value={k}
                        checked={checked}
                        onChange={() => setEdits((e) => ({ ...e, [s.id]: k }))}
                      />
                      <Meta.icon aria-hidden="true" className="h-4 w-4" />
                      <span>{Meta.label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default Register;
