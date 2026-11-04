import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LuGraduationCap, LuSchool, LuUserPlus } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useApi } from '../../hooks/useApi';
import { classesApi, enrollmentsApi, studentsApi } from '../../services/schoolService';
import { getErrorMessage } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { Field, Select } from '../../components/ui/Field';
import CreateUserDialog from '../../components/forms/CreateUserDialog';

const AssignClassDialog = ({ student, classes, onClose, onDone }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const formId = useId();
  const [classId, setClassId] = useState(student?.classId ?? '');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!classId) return;
    setSaving(true);
    try {
      if (user.role === 'ADMIN') await studentsApi.assignClass(student.id, classId);
      else await enrollmentsApi.assignByEmail(student.user.email, classId);
      showToast(`${student.user.fullName} assigned to ${classes.find((c) => c.id === classId)?.name}.`);
      onDone();
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={!!student}
      onClose={onClose}
      title="Assign to class"
      description={student && `Choose a class for ${student.user.fullName}.`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form={formId} loading={saving} disabled={!classId || classId === student?.classId}>
            Assign
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit}>
        <Field label="Class" required>
          <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="" disabled>Select a class…</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name} · {c.level}</option>
            ))}
          </Select>
        </Field>
      </form>
    </Modal>
  );
};

const Students = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user.role === 'ADMIN';
  const canEdit = !user.isDemo;
  const [classFilter, setClassFilter] = useState('');
  const [assigning, setAssigning] = useState(null);
  const [creating, setCreating] = useState(false);

  const students = useApi(() => studentsApi.list(), []);
  const classes = useApi(() => classesApi.list(), []);
  const classList = useMemo(() => classes.data?.classes ?? [], [classes.data]);

  const rows = useMemo(
    () => (students.data?.students ?? []).filter((s) => !classFilter || s.classId === classFilter),
    [students.data, classFilter]
  );

  const columns = [
    {
      id: 'name',
      header: 'Student',
      sortValue: (s) => s.user.fullName,
      cell: (s) => (
        <div className="flex items-center gap-3">
          <Avatar name={s.user.fullName} size="sm" decorative />
          <div className="min-w-0">
            <Link to={`/students/${s.id}`} className="block truncate rounded font-semibold text-ink hover:text-primary-ink hover:underline">
              {s.user.fullName}
            </Link>
            <span className="block truncate text-xs text-ink-subtle">{s.user.email}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'class',
      header: 'Class',
      sortValue: (s) => s.class?.name ?? '',
      cell: (s) => (s.class ? <Badge tone="primary">{s.class.name}</Badge> : <Badge>Unassigned</Badge>),
    },
    {
      id: 'parent',
      header: 'Parent / guardian',
      hideBelow: 'md',
      sortValue: (s) => s.parent?.user.fullName ?? '',
      cell: (s) => s.parent?.user.fullName ?? <span className="text-ink-subtle">Not linked</span>,
    },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      cell: (s) => (
        <div className="flex justify-end gap-1">
          <Button to={`/students/${s.id}`} variant="ghost" size="sm">
            View<span className="sr-only"> {s.user.fullName}</span>
          </Button>
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={() => setAssigning(s)}>
              Assign<span className="sr-only"> {s.user.fullName} to a class</span>
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Students"
        description={isAdmin ? 'Everyone enrolled at the school.' : 'Students in the classes you teach.'}
        actions={isAdmin && canEdit && <Button icon={LuUserPlus} onClick={() => setCreating(true)}>Add student</Button>}
      />

      <DataTable
        caption="Students"
        columns={columns}
        rows={rows}
        loading={students.loading && !students.data}
        error={students.error}
        onRetry={students.refetch}
        searchText={(s) => `${s.user.fullName} ${s.user.email} ${s.parent?.user.fullName ?? ''}`}
        searchPlaceholder="Search by name, email or parent"
        initialSort={{ id: 'name', dir: 'asc' }}
        toolbar={
          <>
            <label htmlFor="student-class-filter" className="sr-only">Filter by class</label>
            <Select id="student-class-filter" value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="w-full sm:w-48">
              <option value="">All classes</option>
              {classList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </>
        }
        emptyState={
          <EmptyState
            icon={classFilter ? LuSchool : LuGraduationCap}
            title={classFilter ? 'No students in this class' : 'No students yet'}
            description={isAdmin ? 'Add a student, or ask students to register.' : 'Students appear here once they join one of your classes.'}
            action={classFilter && <Button variant="secondary" onClick={() => setClassFilter('')}>Show all classes</Button>}
          />
        }
      />

      <AssignClassDialog
        key={assigning?.id}
        student={assigning}
        classes={classList}
        onClose={() => setAssigning(null)}
        onDone={() => {
          setAssigning(null);
          students.refetch();
        }}
      />
      {isAdmin && (
        <CreateUserDialog
          isOpen={creating}
          role="STUDENT"
          onClose={() => setCreating(false)}
          onCreated={(u) => {
            setCreating(false);
            showToast(`${u.fullName} was added.`);
            students.refetch();
          }}
        />
      )}
    </>
  );
};

export default Students;
