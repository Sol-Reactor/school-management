import {
  LuCalendarCheck,
  LuCalendarClock,
  LuChartColumn,
  LuGraduationCap,
  LuLayoutDashboard,
  LuSchool,
  LuSettings,
  LuUserRound,
  LuUsers,
} from 'react-icons/lu';

/** Sidebar sections per role. `label` is also used for breadcrumbs. */
const NAV = {
  ADMIN: [
    { to: '/dashboard', label: 'Dashboard', icon: LuLayoutDashboard },
    { to: '/students', label: 'Students', icon: LuGraduationCap },
    { to: '/teachers', label: 'Teachers', icon: LuUsers },
    { to: '/classes', label: 'Classes', icon: LuSchool },
    { to: '/attendance', label: 'Attendance', icon: LuCalendarCheck },
    { to: '/grades', label: 'Grades', icon: LuChartColumn },
    { to: '/timetable', label: 'Timetable', icon: LuCalendarClock },
  ],
  TEACHER: [
    { to: '/dashboard', label: 'Dashboard', icon: LuLayoutDashboard },
    { to: '/classes', label: 'My classes', icon: LuSchool },
    { to: '/students', label: 'Students', icon: LuGraduationCap },
    { to: '/attendance', label: 'Attendance', icon: LuCalendarCheck },
    { to: '/grades', label: 'Grades', icon: LuChartColumn },
    { to: '/timetable', label: 'Timetable', icon: LuCalendarClock },
  ],
  STUDENT: [
    { to: '/dashboard', label: 'Dashboard', icon: LuLayoutDashboard },
    { to: '/attendance', label: 'My attendance', icon: LuCalendarCheck },
    { to: '/grades', label: 'My grades', icon: LuChartColumn },
    { to: '/timetable', label: 'Timetable', icon: LuCalendarClock },
  ],
  PARENT: [
    { to: '/dashboard', label: 'Dashboard', icon: LuLayoutDashboard },
    { to: '/attendance', label: 'Attendance', icon: LuCalendarCheck },
    { to: '/grades', label: 'Grades', icon: LuChartColumn },
    { to: '/timetable', label: 'Timetable', icon: LuCalendarClock },
  ],
};

export const ACCOUNT_NAV = [
  { to: '/profile', label: 'Profile', icon: LuUserRound },
  { to: '/settings', label: 'Settings', icon: LuSettings },
];

export const navForRole = (role) => NAV[role] ?? [];

/** Route → label map used by breadcrumbs (role-aware labels win). */
export const routeLabel = (role, path) =>
  [...navForRole(role), ...ACCOUNT_NAV].find((n) => n.to === path)?.label ??
  { '/students': 'Students', '/classes': 'Classes' }[path];

export const ROLE_LABEL = { ADMIN: 'Administrator', TEACHER: 'Teacher', STUDENT: 'Student', PARENT: 'Parent' };
