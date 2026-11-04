import { useId, useMemo, useState } from 'react';
import { LuCalendarClock, LuPlus, LuTrash2, LuUsers } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useApi } from '../../hooks/useApi';
import { useForm, validators } from '../../hooks/useForm';
import { classesApi, subjectsApi, teachersApi, timetableApi } from '../../services/schoolService';
import { getErrorMessage } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import { Field, Input, Select } from '../../components/ui/Field';
import { Skeleton } from '../../components/ui/Skeleton';
import FormAlert from '../../components/forms/FormAlert';
import { DAY_ORDER, titleCase } from '../../lib/format';
import { cn } from '../../lib/cn';

const todayName = DAY_ORDER[(new Date().getDay() + 6) % 7];

// Subject tints: categorical hues assigned in a fixed order (never the reserved
// status colours). Text stays in ink; the hue is carried by the edge and wash.
const TINTS = [
  'border-chart-1 bg-chart-1/10',
  'border-chart-2 bg-chart-2/10',
  'border-chart-3 bg-chart-3/10',
  'border-info bg-info/10',
  'border-ink-subtle bg-surface-muted',
];

const Lesson = ({ entry, tint, showClass, showTeacher, onDelete }) => (
  <div className={cn('group relative rounded-lg border-l-4 p-2.5 pl-3 text-left text-ink', tint)}>
    <p className="text-sm font-semibold leading-tight">{entry.subject?.name}</p>
    <p className="mt-0.5 text-xs text-ink-muted tabular">
      {entry.startTime}–{entry.endTime}
    </p>
    {(showClass || showTeacher) && (
      <p className="mt-0.5 truncate text-xs text-ink-muted">
        {showClass && entry.class?.name}
        {showClass && showTeacher && ' · '}
        {showTeacher && entry.teacher?.user?.fullName}
      </p>
    )}
    {onDelete && (
      <button
        type="button"
        onClick={() => onDelete(entry)}
        aria-label={`Remove ${entry.subject?.name} on ${titleCase(entry.day)} at ${entry.startTime}`}
        className="absolute right-1 top-1 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md opacity-0 transition-opacity duration-fast hover:bg-surface/60 focus-visible:opacity-100 group-hover:opacity-100"
      >
        <LuTrash2 aria-hidden="true" className="h-3.5 w-3.5" />
      </button>
    )}
  </div>
);

const WeekView = ({ entries, showClass, showTeacher, onDelete }) => {
  const subjects = [...new Set(entries.map((e) => e.subject?.name))].sort();
  const tintOf = (e) => TINTS[subjects.indexOf(e.subject?.name) % TINTS.length];
  const days = DAY_ORDER.filter((d, i) => i < 5 || entries.some((e) => e.day === d));
  const slots = [...new Set(entries.map((e) => `${e.startTime}|${e.endTime}`))].sort();
  const at = (day, slot) => entries.filter((e) => e.day === day && `${e.startTime}|${e.endTime}` === slot);

  return (
    <>
      {/* md+: grid */}
      <div className="relative hidden overflow-x-auto md:block" role="region" aria-label="Weekly timetable" tabIndex={0}>
        <table className="w-full min-w-[44rem] table-fixed border-separate border-spacing-1.5">
          <caption className="sr-only">Weekly timetable</caption>
          <thead>
            <tr>
              <th scope="col" className="w-24 text-left text-xs font-semibold uppercase tracking-wide text-ink-subtle">Time</th>
              {days.map((d) => (
                <th key={d} scope="col" className={cn('rounded-md py-1.5 text-xs font-semibold uppercase tracking-wide', d === todayName ? 'bg-primary text-primary-on' : 'text-ink-subtle')}>
                  {titleCase(d).slice(0, 3)}
                  {d === todayName && <span className="sr-only"> (today)</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => {
              const [start, end] = slot.split('|');
              return (
                <tr key={slot}>
                  <th scope="row" className="align-top text-left text-xs font-medium text-ink-subtle tabular">
                    {start}
                    <span className="block font-normal">{end}</span>
                  </th>
                  {days.map((d) => (
                    <td key={d} className="align-top">
                      <div className="space-y-1.5">
                        {at(d, slot).map((e) => (
                          <Lesson key={e.id} entry={e} tint={tintOf(e)} showClass={showClass} showTeacher={showTeacher} onDelete={onDelete} />
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Phones: one list per day, today first */}
      <div className="space-y-5 md:hidden">
        {[...days.slice(days.indexOf(todayName) >= 0 ? days.indexOf(todayName) : 0), ...days.slice(0, Math.max(0, days.indexOf(todayName)))].map((d) => {
          const lessons = entries.filter((e) => e.day === d).sort((a, b) => a.startTime.localeCompare(b.startTime));
          return (
            <section key={d} aria-labelledby={`day-${d}`}>
              <h2 id={`day-${d}`} className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
                {titleCase(d)}
                {d === todayName && <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] text-primary-on">Today</span>}
              </h2>
              {lessons.length ? (
                <div className="grid gap-2">
                  {lessons.map((e) => (
                    <Lesson key={e.id} entry={e} tint={tintOf(e)} showClass={showClass} showTeacher={showTeacher} onDelete={onDelete} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-subtle">No lessons.</p>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
};

const AddLessonDialog = ({ classId, isAdmin, teacherId, onClose, onAdded }) => {
  const formId = useId();
  const subjects = useApi(() => subjectsApi.list({ classId }), [classId]);
  const teachers = useApi(() => teachersApi.list(), [], { enabled: isAdmin });
  const form = useForm({ subjectId: '', teacherId: isAdmin ? '' : teacherId, day: 'MONDAY', startTime: '08:00', endTime: '08:50' }, (v) => ({
    subjectId: validators.required(v.subjectId, 'Subject'),
    teacherId: validators.required(v.teacherId, 'Teacher'),
    endTime: v.endTime <= v.startTime ? 'End time must be after the start time' : undefined,
  }));

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Add a lesson"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={form.submitting}>Cancel</Button>
          <Button type="submit" form={formId} loading={form.submitting}>Add lesson</Button>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        className="space-y-4"
        onSubmit={form.handleSubmit(async (v) => {
          await timetableApi.create({ ...v, classId });
          onAdded();
        })}
      >
        <FormAlert>{form.formError}</FormAlert>
        <Field label="Subject" required error={form.errors.subjectId}>
          <Select {...form.field('subjectId')}>
            <option value="">Select…</option>
            {(subjects.data?.subjects ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </Field>
        {isAdmin && (
          <Field label="Teacher" required error={form.errors.teacherId}>
            <Select {...form.field('teacherId')}>
              <option value="">Select…</option>
              {(teachers.data?.teachers ?? []).map((t) => <option key={t.id} value={t.id}>{t.user.fullName}</option>)}
            </Select>
          </Field>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Day" required>
            <Select {...form.field('day')}>
              {DAY_ORDER.slice(0, 6).map((d) => <option key={d} value={d}>{titleCase(d)}</option>)}
            </Select>
          </Field>
          <Field label="Starts" required>
            <Input type="time" {...form.field('startTime')} />
          </Field>
          <Field label="Ends" required error={form.errors.endTime}>
            <Input type="time" {...form.field('endTime')} />
          </Field>
        </div>
      </form>
    </Modal>
  );
};

const Timetable = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isStaff = ['ADMIN', 'TEACHER'].includes(user.role);
  const children = user.parent?.students ?? [];
  const classes = useApi(() => classesApi.list(), [], { enabled: isStaff });
  const classList = useMemo(() => classes.data?.classes ?? [], [classes.data]);

  // What are we looking at? 'mine' = a teacher's own week.
  const [selection, setSelection] = useState(user.role === 'TEACHER' ? 'mine' : null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const classId =
    user.role === 'STUDENT'
      ? user.student?.classId
      : user.role === 'PARENT'
        ? children.find((c) => c.id === selection)?.classId ?? children[0]?.classId
        : selection === 'mine'
          ? null
          : selection ?? classList[0]?.id;

  const timetable = useApi(
    async () => {
      if (selection === 'mine' && user.role === 'TEACHER') return (await timetableApi.forTeacher(user.teacher.id)).timetable;
      if (!classId) return [];
      const { timetable: grouped } = await timetableApi.forClass(classId);
      return Object.values(grouped).flat();
    },
    [selection, classId],
    { enabled: user.role !== 'ADMIN' || !!classId || classes.data != null }
  );

  const entries = timetable.data ?? [];
  const canEdit = isStaff && !user.isDemo && classId && (user.role === 'ADMIN' || classList.some((c) => c.id === classId));

  const remove = async () => {
    setBusy(true);
    try {
      await timetableApi.remove(deleting.id);
      showToast('Lesson removed.');
      setDeleting(null);
      timetable.refetch();
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  const picker =
    isStaff ? (
      <div className="w-full sm:w-64">
        <label htmlFor="tt-view" className="sr-only">Show timetable for</label>
        <Select id="tt-view" value={selection ?? classId ?? ''} onChange={(e) => setSelection(e.target.value)}>
          {user.role === 'TEACHER' && <option value="mine">My teaching week</option>}
          {classList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </div>
    ) : user.role === 'PARENT' && children.length > 1 ? (
      <div className="w-full sm:w-56">
        <label htmlFor="tt-child" className="sr-only">Show timetable for</label>
        <Select id="tt-child" value={selection ?? children[0].id} onChange={(e) => setSelection(e.target.value)}>
          {children.map((c) => <option key={c.id} value={c.id}>{c.user.fullName}{c.class ? ` · ${c.class.name}` : ''}</option>)}
        </Select>
      </div>
    ) : null;

  const noClass = (user.role === 'STUDENT' && !user.student?.classId) || (user.role === 'PARENT' && !children.length);

  return (
    <>
      <PageHeader
        title="Timetable"
        description={selection === 'mine' ? 'Every lesson you teach this week.' : 'The weekly lesson plan.'}
        actions={
          <>
            {picker}
            {canEdit && <Button icon={LuPlus} onClick={() => setAdding(true)}>Add lesson</Button>}
          </>
        }
      />
      <Card className="p-3 sm:p-4">
        {noClass ? (
          <EmptyState icon={LuUsers} title="No class yet" description="The timetable appears once there's a class to show." />
        ) : timetable.loading && !timetable.data ? (
          <div role="status" aria-live="polite" className="space-y-2">
            <span className="sr-only">Loading timetable…</span>
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : timetable.error ? (
          <EmptyState title="Couldn't load the timetable" description={timetable.error} action={<Button variant="secondary" onClick={timetable.refetch}>Try again</Button>} />
        ) : entries.length === 0 ? (
          <EmptyState icon={LuCalendarClock} title="No lessons scheduled" description={canEdit ? 'Add the first lesson for this class.' : 'Lessons will appear here once they are scheduled.'} action={canEdit && <Button icon={LuPlus} onClick={() => setAdding(true)}>Add lesson</Button>} />
        ) : (
          <WeekView entries={entries} showClass={selection === 'mine'} showTeacher={selection !== 'mine'} onDelete={canEdit ? setDeleting : undefined} />
        )}
      </Card>

      {adding && (
        <AddLessonDialog
          classId={classId}
          isAdmin={user.role === 'ADMIN'}
          teacherId={user.teacher?.id}
          onClose={() => setAdding(false)}
          onAdded={() => {
            setAdding(false);
            showToast('Lesson added.');
            timetable.refetch();
          }}
        />
      )}
      <ConfirmDialog
        isOpen={!!deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={remove}
        loading={busy}
        title="Remove this lesson?"
        description={deleting && `${deleting.subject?.name} on ${titleCase(deleting.day)} at ${deleting.startTime} will be removed from the timetable.`}
        confirmLabel="Remove lesson"
      />
    </>
  );
};

export default Timetable;
