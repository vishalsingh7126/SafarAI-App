import { Navigate, useLocation } from 'react-router-dom';
import RouteFallback from './RouteFallback';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <RouteFallback />;
  if (!user) return <Navigate to="/auth" replace state={{ from: location.pathname }} />;

  return children;
}

export default ProtectedRoute;