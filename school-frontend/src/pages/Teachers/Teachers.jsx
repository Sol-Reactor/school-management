import { useState } from 'react';
import { LuTrash2, LuUserPlus, LuUsers } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useApi } from '../../hooks/useApi';
import { teachersApi, usersApi } from '../../services/schoolService';
import { getErrorMessage } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import CreateUserDialog from '../../components/forms/CreateUserDialog';

const Teachers = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const canEdit = !user.isDemo;
  const teachers = useApi(() => teachersApi.list(), []);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      await usersApi.remove(removing.user.id);
      showToast(`${removing.user.fullName} was removed.`);
      setRemoving(null);
      teachers.refetch();
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      id: 'name',
      header: 'Teacher',
      sortValue: (t) => t.user.fullName,
      cell: (t) => (
        <div className="flex items-center gap-3">
          <Avatar name={t.user.fullName} size="sm" decorative />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{t.user.fullName}</p>
            <p className="truncate text-xs text-ink-subtle">{t.user.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'classes',
      header: 'Classes',
      sortValue: (t) => t._count.classes,
      cell: (t) =>
        t.classes.length ? (
          <div className="flex flex-wrap gap-1">
            {t.classes.map((c) => (
              <Badge key={c.id} tone="primary">{c.name}</Badge>
            ))}
          </div>
        ) : (
          <span className="text-ink-subtle">Subject teacher</span>
        ),
    },
    { id: 'exams', header: 'Exams set', align: 'right', hideBelow: 'sm', sortValue: (t) => t._count.exams, cell: (t) => t._count.exams },
    ...(canEdit
      ? [
          {
            id: 'actions',
            header: <span className="sr-only">Actions</span>,
            align: 'right',
            cell: (t) => (
              <Button variant="danger-ghost" size="icon-sm" onClick={() => setRemoving(t)} aria-label={`Remove ${t.user.fullName}`}>
                <LuTrash2 aria-hidden="true" className="h-4 w-4" />
              </Button>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Teachers"
        description="Teacher accounts are created here by administrators. Public sign-up is for students and parents only."
        actions={canEdit && <Button icon={LuUserPlus} onClick={() => setCreating(true)}>Add teacher</Button>}
      />
      <DataTable
        caption="Teachers"
        columns={columns}
        rows={teachers.data?.teachers ?? []}
        loading={teachers.loading && !teachers.data}
        error={teachers.error}
        onRetry={teachers.refetch}
        searchText={(t) => `${t.user.fullName} ${t.user.email} ${t.classes.map((c) => c.name).join(' ')}`}
        searchPlaceholder="Search teachers or classes"
        initialSort={{ id: 'name', dir: 'asc' }}
        emptyState={
          <EmptyState
            icon={LuUsers}
            title="No teachers yet"
            description="Add your first teacher to start assigning classes."
            action={canEdit && <Button icon={LuUserPlus} onClick={() => setCreating(true)}>Add teacher</Button>}
          />
        }
      />

      <CreateUserDialog
        isOpen={creating}
        role="TEACHER"
        onClose={() => setCreating(false)}
        onCreated={(u) => {
          setCreating(false);
          showToast(`${u.fullName} can now sign in as a teacher.`);
          teachers.refetch();
        }}
      />
      <ConfirmDialog
        isOpen={!!removing}
        onCancel={() => setRemoving(null)}
        onConfirm={remove}
        loading={busy}
        title={`Remove ${removing?.user.fullName}?`}
        description="Their account will be deleted and their classes will become unassigned. Teachers who still have exams or timetable slots can't be removed until those are reassigned."
        confirmLabel="Remove teacher"
      />
    </>
  );
};

export default Teachers;
