import { useMemo, useState } from 'react';
import { LuCalendarCheck } from 'react-icons/lu';
import { useApi } from '../../hooks/useApi';
import { attendanceApi } from '../../services/schoolService';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { Select } from '../../components/ui/Field';
import AttendanceTrendChart from '../../components/charts/AttendanceTrendChart';
import AttendanceBreakdown from '../../components/charts/AttendanceBreakdown';
import { STATUS_META } from '../../lib/attendanceStatus';
import { formatWeekday } from '../../lib/format';
import { weeklyAttendance } from '../../lib/stats';

/** Read-only attendance history for one student (used by students and parents). */
const StudentAttendanceView = ({ studentId, name }) => {
  const { data, loading, error, refetch } = useApi(() => attendanceApi.forStudent(studentId), [studentId]);
  const [status, setStatus] = useState('');
  const records = useMemo(() => data?.attendance ?? [], [data]);
  const filtered = useMemo(() => (status ? records.filter((r) => r.status === status) : records), [records, status]);

  const columns = [
    { id: 'date', header: 'Date', sortValue: (r) => new Date(r.date), cell: (r) => <span className="font-medium text-ink">{formatWeekday(r.date)}</span> },
    { id: 'class', header: 'Class', hideBelow: 'sm', cell: (r) => r.class?.name },
    {
      id: 'status',
      header: 'Status',
      sortValue: (r) => r.status,
      cell: (r) => {
        const m = STATUS_META[r.status];
        return <Badge tone={m.tone} icon={m.icon}>{m.label}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AttendanceTrendChart title={`Weekly attendance${name ? ` · ${name}` : ''}`} series={[{ key: 's', name: name ?? 'Attendance', data: weeklyAttendance(records) }]} />
        </div>
        <Card>
          <CardHeader title="Breakdown" description="All recorded sessions" />
          <CardBody>
            <AttendanceBreakdown counts={data?.summary ?? {}} />
          </CardBody>
        </Card>
      </div>
      <DataTable
        caption="Attendance records"
        columns={columns}
        rows={filtered}
        loading={loading && !data}
        error={error}
        onRetry={refetch}
        initialSort={{ id: 'date', dir: 'desc' }}
        toolbar={
          <>
            <label htmlFor="att-status" className="sr-only">Filter by status</label>
            <Select id="att-status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-full sm:w-44">
              <option value="">All statuses</option>
              {Object.entries(STATUS_META).map(([k, m]) => (
                <option key={k} value={k}>{m.label}</option>
              ))}
            </Select>
          </>
        }
        emptyState={<EmptyState icon={LuCalendarCheck} title="No attendance recorded yet" description="Records appear once a teacher takes the register." />}
      />
    </div>
  );
};

export default StudentAttendanceView;
