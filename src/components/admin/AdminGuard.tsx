import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function AdminGuard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-primary">
        <p className="text-text-muted text-sm font-mono">Loading...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
