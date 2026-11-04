// Attendance status presentation: label + icon + reserved status colour (never colour alone).
import { LuCircleCheck, LuCircleX, LuClock, LuFileCheck } from 'react-icons/lu';

export const STATUS_META = {
  PRESENT: { label: 'Present', icon: LuCircleCheck, bar: 'bg-success', text: 'text-success', tone: 'success' },
  LATE: { label: 'Late', icon: LuClock, bar: 'bg-warning', text: 'text-warning', tone: 'warning' },
  EXCUSED: { label: 'Excused', icon: LuFileCheck, bar: 'bg-info', text: 'text-info', tone: 'info' },
  ABSENT: { label: 'Absent', icon: LuCircleX, bar: 'bg-danger', text: 'text-danger', tone: 'danger' },
};

export const STATUS_ORDER = ['PRESENT', 'LATE', 'EXCUSED', 'ABSENT'];
