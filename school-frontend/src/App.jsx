import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import { ServerWakeScreen } from './components/ServerStatus/ServerWakeNotice';
import Home from './pages/Home/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import NotFound from './pages/NotFound/NotFound';
import { DashboardSkeleton } from './pages/Dashboard/widgets';

// App pages are split out so the landing page stays light (Recharts lives in the dashboard chunk).
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Students = lazy(() => import('./pages/Students/Students'));
const StudentProfile = lazy(() => import('./pages/Students/StudentProfile'));
const Teachers = lazy(() => import('./pages/Teachers/Teachers'));
const Classes = lazy(() => import('./pages/Classes/Classes'));
const Attendance = lazy(() => import('./pages/Attendance/Attendance'));
const Grades = lazy(() => import('./pages/Grades/Grades'));
const Timetable = lazy(() => import('./pages/Timetable/Timetable'));
const Profile = lazy(() => import('./pages/Profile/Profile'));
const Settings = lazy(() => import('./pages/Settings/Settings'));

const STAFF = ['ADMIN', 'TEACHER'];

const page = (Component) => (
  <Suspense fallback={<DashboardSkeleton />}>
    <Component />
  </Suspense>
);

function App() {
  return (
    <Suspense fallback={<ServerWakeScreen />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={page(Dashboard)} />
            <Route path="/students/:id" element={page(StudentProfile)} />
            <Route path="/attendance" element={page(Attendance)} />
            <Route path="/grades" element={page(Grades)} />
            <Route path="/timetable" element={page(Timetable)} />
            <Route path="/profile" element={page(Profile)} />
            <Route path="/settings" element={page(Settings)} />
            <Route element={<ProtectedRoute roles={STAFF} />}>
              <Route path="/students" element={page(Students)} />
              <Route path="/classes" element={page(Classes)} />
            </Route>
            <Route element={<ProtectedRoute roles={['ADMIN']} />}>
              <Route path="/teachers" element={page(Teachers)} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
