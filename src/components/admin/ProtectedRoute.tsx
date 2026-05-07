import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/AuthProvider';

export function ProtectedRoute({ role }: { role?: 'admin' | 'client' }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center bg-cream text-ink">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/meus-agendamentos'} replace />;
  return <Outlet />;
}
