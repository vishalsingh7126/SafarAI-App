import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoute({ session, loading, isAdmin }) {
  if (loading) {
    return null;
  }

  return session || isAdmin ? <Outlet /> : <Navigate to="/auth" replace />;
}

export default ProtectedRoute;