// Gradebook for one exam: class roster with a marks input per student.
import { useMemo, useState } from 'react';
import { LuSave } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useApi } from '../../hooks/useApi';
import { classesApi, gradesApi } from '../../services/schoolService';
import { getErrorMessage } from '../../services/api';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Input } from '../../components/ui/Field';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { formatDate, gradeBand } from '../../lib/format';

const validMarks = (v) => v === '' || (/^\d{1,3}$/.test(v) && Number(v) <= 100);

const Gradebook = ({ exam, onClose, onSaved }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const roster = useApi(() => classesApi.students(exam.class.id), [exam.class.id]);
  const grades = useApi(() => gradesApi.forExam(exam.id), [exam.id]);
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(false);
  const future = new Date(exam.date) > new Date();

  const saved = useMemo(() => Object.fromEntries((grades.data?.grades ?? []).map((g) => [g.studentId, g])), [grades.data]);
  const students = roster.data?.students ?? [];
  const value = (sid) => edits[sid] ?? (saved[sid] ? String(saved[sid].marks) : '');
  const changed = students.filter((s) => edits[s.id] !== undefined && edits[s.id] !== '' && Number(edits[s.id]) !== saved[s.id]?.marks);
  const invalid = students.filter((s) => !validMarks(value(s.id)));
  const stats = grades.data?.statistics;

  const save = async () => {
    setSaving(true);
    try {
      await Promise.all(
        changed.map((s) =>
          saved[s.id] ? gradesApi.update(saved[s.id].id, Number(edits[s.id])) : gradesApi.create({ examId: exam.id, studentId: s.id, marks: Number(edits[s.id]) })
        )
      );
      showToast(`Saved marks for ${changed.length} ${changed.length === 1 ? 'student' : 'students'}.`);
      setEdits({});
      grades.refetch();
      onSaved?.();
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const loading = (roster.loading && !roster.data) || (grades.loading && !grades.data);

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="lg"
      title={`${exam.subject.name} · ${exam.name}`}
      description={`${exam.class.name} · ${formatDate(exam.date)}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          {!user.isDemo && (
            <Button icon={LuSave} onClick={save} loading={saving} disabled={!changed.length || invalid.length > 0}>
              Save marks{changed.length > 0 && ` (${changed.length})`}
            </Button>
          )}
        </>
      }
    >
      {stats && stats.totalStudents > 0 && (
        <dl className="mb-5 grid grid-cols-3 gap-3">
          {[
            ['Average', `${Math.round(stats.average * 10) / 10}%`],
            ['Highest', `${stats.highest}%`],
            ['Lowest', `${stats.lowest}%`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-surface-muted/60 p-3">
              <dt className="text-xs font-medium text-ink-muted">{k}</dt>
              <dd className="mt-0.5 text-xl font-bold text-ink tabular">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {future && <p className="mb-4 rounded-lg bg-info-soft px-3 py-2 text-sm text-info">This exam hasn't taken place yet. You can still pre-enter marks.</p>}
      {user.isDemo && <p className="mb-4 rounded-lg bg-accent-soft px-3 py-2 text-sm text-ink">Demo mode: marks are read-only.</p>}

      {loading ? (
        <div role="status"><span className="sr-only">Loading gradebook…</span><TableSkeleton rows={6} columns={2} /></div>
      ) : (
        <table className="w-full text-sm">
          <caption className="sr-only">Marks for {exam.name}</caption>
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-subtle">
              <th scope="col" className="pb-2 font-semibold">Student</th>
              <th scope="col" className="w-32 pb-2 font-semibold">Marks (0–100)</th>
              <th scope="col" className="w-16 pb-2 text-right font-semibold">Band</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {students.map((s) => {
              const v = value(s.id);
              const bad = !validMarks(v);
              const band = v !== '' && !bad ? gradeBand(Number(v)) : null;
              const inputId = `marks-${s.id}`;
              return (
                <tr key={s.id}>
                  <td className="py-2 pr-3">
                    <label htmlFor={inputId} className="font-medium text-ink">{s.user.fullName}</label>
                    {bad && <p id={`${inputId}-err`} role="alert" className="text-xs text-danger">Enter a whole number from 0 to 100</p>}
                  </td>
                  <td className="py-2 pr-3">
                    <Input
                      id={inputId}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={v}
                      readOnly={user.isDemo}
                      invalid={bad}
                      aria-invalid={bad || undefined}
                      aria-describedby={bad ? `${inputId}-err` : undefined}
                      onChange={(e) => setEdits((x) => ({ ...x, [s.id]: e.target.value.trim() }))}
                      className="h-9 w-24 text-right tabular"
                    />
                  </td>
                  <td className="py-2 text-right">{band ? <Badge tone={band.tone} className="w-8 justify-center">{band.label}</Badge> : <span className="text-ink-subtle">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Modal>
  );
};

export default Gradebook;
