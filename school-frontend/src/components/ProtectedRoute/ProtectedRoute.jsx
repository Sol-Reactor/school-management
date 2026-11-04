import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ServerWakeScreen } from '../ServerStatus/ServerWakeNotice';

/**
 * Guards authenticated routes. While the session is being restored (possibly
 * waiting for a cold-starting server) it shows a status screen instead of a blank page.
 * Optional `roles` restricts the route to specific roles.
 */
const ProtectedRoute = ({ roles, children }) => {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'checking') return <ServerWakeScreen />;

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ?? <Outlet />;
};

export default ProtectedRoute;
