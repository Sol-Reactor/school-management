import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LuPencil, LuPlus, LuSchool, LuSearch, LuSearchX, LuTrash2, LuUserPlus, LuUsers } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useApi } from '../../hooks/useApi';
import { useForm, validators } from '../../hooks/useForm';
import { classesApi, enrollmentsApi } from '../../services/schoolService';
import { getErrorMessage } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { Field, Input } from '../../components/ui/Field';
import { Skeleton } from '../../components/ui/Skeleton';
import FormAlert from '../../components/forms/FormAlert';

const ClassFormDialog = ({ isOpen, initial, isAdmin, onClose, onSaved }) => {
  const formId = useId();
  const editing = !!initial;
  const form = useForm(
    { name: initial?.name ?? '', level: initial?.level ?? '', teacherEmail: '' },
    (v) => ({
      name: validators.required(v.name, 'Class name'),
      level: validators.required(v.level, 'Level'),
      teacherEmail: validators.email(v.teacherEmail),
    })
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? `Edit ${initial.name}` : 'Create class'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={form.submitting}>Cancel</Button>
          <Button type="submit" form={formId} loading={form.submitting}>{editing ? 'Save changes' : 'Create class'}</Button>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        className="space-y-4"
        onSubmit={form.handleSubmit(async ({ name, level, teacherEmail }) => {
          const saved = editing
            ? await classesApi.update(initial.id, { name, level })
            : await classesApi.create({ name, level, ...(isAdmin && teacherEmail && { teacherEmail }) });
          onSaved(saved.class, editing);
        })}
      >
        <FormAlert>{form.formError}</FormAlert>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Class name" required hint="e.g. Grade 7A" error={form.errors.name}>
            <Input {...form.field('name')} />
          </Field>
          <Field label="Level" required hint="e.g. Grade 7" error={form.errors.level}>
            <Input {...form.field('level')} />
          </Field>
        </div>
        {!editing &&
          (isAdmin ? (
            <Field label="Class teacher's email" optional hint="Leave blank to assign a teacher later." error={form.errors.teacherEmail}>
              <Input type="email" inputMode="email" {...form.field('teacherEmail')} />
            </Field>
          ) : (
            <p className="text-sm text-ink-muted">You'll be the class teacher for this class.</p>
          ))}
      </form>
    </Modal>
  );
};

const EnrollDialog = ({ cls, onClose, onDone }) => {
  const formId = useId();
  const form = useForm({ studentEmail: '' }, (v) => ({
    studentEmail: validators.required(v.studentEmail, 'Email') || validators.email(v.studentEmail),
  }));
  return (
    <Modal
      isOpen={!!cls}
      onClose={onClose}
      size="sm"
      title={`Add a student to ${cls?.name}`}
      description="Enter the email the student registered with."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={form.submitting}>Cancel</Button>
          <Button type="submit" form={formId} loading={form.submitting}>Add student</Button>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        className="space-y-4"
        onSubmit={form.handleSubmit(async ({ studentEmail }) => {
          const { enrollment } = await enrollmentsApi.assignByEmail(studentEmail, cls.id);
          onDone(enrollment.student.user.fullName);
        })}
      >
        <FormAlert>{form.formError}</FormAlert>
        <Field label="Student email" required error={form.errors.studentEmail}>
          <Input type="email" inputMode="email" autoComplete="off" {...form.field('studentEmail')} />
        </Field>
      </form>
    </Modal>
  );
};

const ClassDetailDialog = ({ classId, onClose }) => {
  const detail = useApi(() => classesApi.get(classId), [classId], { enabled: !!classId });
  const c = detail.data?.class;
  return (
    <Modal isOpen={!!classId} onClose={onClose} title={c?.name ?? 'Class'} description={c && `${c.level} · ${c.students.length} students`} size="lg">
      {!c ? (
        <div className="space-y-3" role="status" aria-label="Loading class">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-surface-muted/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Class teacher</p>
              <p className="mt-1 font-semibold text-ink">{c.teacher?.user.fullName ?? 'Unassigned'}</p>
            </div>
            <div className="rounded-lg bg-surface-muted/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Subjects</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {c.subjects.length ? c.subjects.map((s) => <Badge key={s.id}>{s.name}</Badge>) : <span className="text-sm text-ink-subtle">None yet</span>}
              </div>
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink">Students</h3>
            {c.students.length === 0 ? (
              <p className="text-sm text-ink-subtle">No students enrolled yet.</p>
            ) : (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {c.students.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2">
                    <Avatar name={s.user.fullName} size="xs" decorative />
                    <Link to={`/students/${s.id}`} className="truncate rounded text-sm font-medium text-ink hover:text-primary-ink hover:underline">
                      {s.user.fullName}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

const Classes = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user.role === 'ADMIN';
  const canManage = ['ADMIN', 'TEACHER'].includes(user.role) && !user.isDemo;
  const classes = useApi(() => classesApi.list(), []);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(null); // { initial? }
  const [enrolling, setEnrolling] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = classes.data?.classes ?? [];
    return q ? all.filter((c) => `${c.name} ${c.level} ${c.teacher?.user.fullName ?? ''}`.toLowerCase().includes(q)) : all;
  }, [classes.data, query]);

  const remove = async () => {
    setBusy(true);
    try {
      await classesApi.remove(deleting.id);
      showToast(`${deleting.name} was deleted.`);
      setDeleting(null);
      classes.refetch();
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  const total = classes.data?.classes?.length ?? 0;

  return (
    <>
      <PageHeader
        title={user.role === 'TEACHER' ? 'My classes' : 'Classes'}
        description={isAdmin ? 'Every class, its teacher and enrolment.' : 'Classes you teach.'}
        actions={canManage && <Button icon={LuPlus} onClick={() => setForm({})}>Create class</Button>}
      />

      {total > 0 && (
        <div className="mb-4 max-w-xs">
          <label htmlFor="class-search" className="sr-only">Search classes</label>
          <Input id="class-search" type="search" icon={LuSearch} placeholder="Search classes or teachers" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      )}

      {classes.loading && !classes.data ? (
        <div role="status" aria-live="polite" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <span className="sr-only">Loading classes…</span>
          {[0, 1, 2].map((i) => (
            <div key={i} className="card space-y-3 p-5" aria-hidden="true">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      ) : classes.error ? (
        <div className="card">
          <EmptyState title="Couldn't load classes" description={classes.error} action={<Button variant="secondary" onClick={classes.refetch}>Try again</Button>} />
        </div>
      ) : total === 0 ? (
        <div className="card">
          <EmptyState
            icon={LuSchool}
            title="No classes yet"
            description={canManage ? 'Create your first class to start enrolling students.' : 'You will see your classes here once you are enrolled.'}
            action={canManage && <Button icon={LuPlus} onClick={() => setForm({})}>Create class</Button>}
          />
        </div>
      ) : list.length === 0 ? (
        <div className="card">
          <EmptyState compact icon={LuSearchX} title="No matching classes" action={<Button variant="secondary" size="sm" onClick={() => setQuery('')}>Clear search</Button>} />
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => (
            <li key={c.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-ink">{c.name}</h2>
                  <p className="text-sm text-ink-subtle">{c.level}</p>
                </div>
                {canManage && (
                  <div className="-mr-2 -mt-1 flex">
                    <Button variant="ghost" size="icon-sm" aria-label={`Edit ${c.name}`} onClick={() => setForm({ initial: c })}>
                      <LuPencil aria-hidden="true" className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                      <Button variant="danger-ghost" size="icon-sm" aria-label={`Delete ${c.name}`} onClick={() => setDeleting(c)}>
                        <LuTrash2 aria-hidden="true" className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <dl className="mt-4 flex flex-wrap gap-2 text-sm">
                <div className="flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-ink-muted">
                  <dt><LuUsers aria-hidden="true" className="h-3.5 w-3.5" /><span className="sr-only">Students</span></dt>
                  <dd className="tabular">{c._count.students} students</dd>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-ink-muted">
                  <dt className="sr-only">Teacher</dt>
                  <dd>{c.teacher?.user.fullName ?? 'No teacher yet'}</dd>
                </div>
              </dl>
              <div className="mt-auto flex gap-2 pt-5">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => setViewing(c.id)}>
                  View class<span className="sr-only"> {c.name}</span>
                </Button>
                {canManage && (
                  <Button variant="soft" size="sm" icon={LuUserPlus} className="flex-1" onClick={() => setEnrolling(c)}>
                    Add student<span className="sr-only"> to {c.name}</span>
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {form && (
        <ClassFormDialog
          isOpen
          initial={form.initial}
          isAdmin={isAdmin}
          onClose={() => setForm(null)}
          onSaved={(saved, edited) => {
            setForm(null);
            showToast(edited ? `${saved.name} updated.` : `${saved.name} created.`);
            classes.refetch();
          }}
        />
      )}
      {enrolling && (
        <EnrollDialog
          cls={enrolling}
          onClose={() => setEnrolling(null)}
          onDone={(name) => {
            showToast(`${name} added to ${enrolling.name}.`);
            setEnrolling(null);
            classes.refetch();
          }}
        />
      )}
      <ClassDetailDialog classId={viewing} onClose={() => setViewing(null)} />
      <ConfirmDialog
        isOpen={!!deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={remove}
        loading={busy}
        title={`Delete ${deleting?.name}?`}
        description="Students will be unenrolled and its timetable removed. Classes that already have exams or attendance records can't be deleted."
        confirmLabel="Delete class"
      />
    </>
  );
};

export default Classes;
