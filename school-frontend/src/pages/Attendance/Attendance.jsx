import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LuSchool, LuUsers } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { classesApi } from '../../services/schoolService';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import { Field, Input, Select } from '../../components/ui/Field';
import { cn } from '../../lib/cn';
import Register from './Register';
import StudentAttendanceView from './StudentAttendanceView';

const todayISO = () => new Date().toISOString().slice(0, 10);

const StaffAttendance = () => {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const classes = useApi(() => classesApi.list(), []);
  const list = classes.data?.classes ?? [];
  const classId = params.get('class') || list[0]?.id || '';
  const date = params.get('date') || todayISO();

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    next.set(key, value);
    setParams(next, { replace: true });
  };

  return (
    <>
      <PageHeader title="Attendance" description={user.role === 'TEACHER' ? "Take today's register or correct a past one." : 'Review or correct any class register.'} />
      {!classes.loading && list.length === 0 ? (
        <Card><EmptyState icon={LuSchool} title="No classes to take attendance for" description="Create a class first." /></Card>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,16rem)_minmax(0,12rem)]">
            <Field label="Class">
              <Select value={classId} onChange={(e) => update('class', e.target.value)} disabled={!list.length}>
                {list.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Date">
              <Input type="date" value={date} max={todayISO()} onChange={(e) => e.target.value && update('date', e.target.value)} />
            </Field>
          </div>
          {classId && <Register key={`${classId}-${date}`} classId={classId} date={date} />}
        </>
      )}
    </>
  );
};

const ParentAttendance = () => {
  const { user } = useAuth();
  const children = user.parent?.students ?? [];
  const [active, setActive] = useState(children[0]?.id);
  const child = children.find((c) => c.id === active);

  if (!children.length) {
    return (
      <>
        <PageHeader title="Attendance" />
        <Card><EmptyState icon={LuUsers} title="No children linked yet" /></Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Attendance" description="Your children's attendance this term." />
      {children.length > 1 && (
        <div role="tablist" aria-label="Choose a child" className="mb-6 inline-flex rounded-xl border border-line bg-surface p-1">
          {children.map((c) => (
            <button
              key={c.id}
              role="tab"
              type="button"
              aria-selected={c.id === active}
              onClick={() => setActive(c.id)}
              className={cn(
                'h-9 cursor-pointer rounded-lg px-4 text-sm font-semibold transition-colors duration-fast',
                c.id === active ? 'bg-primary text-primary-on' : 'text-ink-muted hover:text-ink'
              )}
            >
              {c.user.fullName.split(' ')[0]}
            </button>
          ))}
        </div>
      )}
      <div role="tabpanel">
        <StudentAttendanceView key={active} studentId={active} name={child?.user.fullName.split(' ')[0]} />
      </div>
    </>
  );
};

const Attendance = () => {
  const { user } = useAuth();
  if (user.role === 'STUDENT') {
    return (
      <>
        <PageHeader title="My attendance" description="Every register you've been marked on this term." />
        <StudentAttendanceView studentId={user.student?.id} />
      </>
    );
  }
  if (user.role === 'PARENT') return <ParentAttendance />;
  return <StaffAttendance />;
};

export default Attendance;
