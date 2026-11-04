import { LuRefreshCw, LuServerCrash } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { dashboardApi } from '../../services/schoolService';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import AdminDashboard from './AdminDashboard';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';
import ParentDashboard from './ParentDashboard';
import { DashboardSkeleton } from './widgets';

const BY_ROLE = {
  ADMIN: AdminDashboard,
  TEACHER: TeacherDashboard,
  STUDENT: StudentDashboard,
  PARENT: ParentDashboard,
};

const Dashboard = () => {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useApi(() => dashboardApi.get(), [user?.id]);
  const View = BY_ROLE[user?.role];

  if (loading && !data) return <DashboardSkeleton />;
  if (error && !data) {
    return (
      <Card>
        <EmptyState
          icon={LuServerCrash}
          title="We couldn't load your dashboard"
          description={error}
          action={<Button variant="secondary" icon={LuRefreshCw} onClick={refetch}>Try again</Button>}
        />
      </Card>
    );
  }
  return View ? <View data={data} user={user} /> : null;
};

export default Dashboard;
