import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/AuthProvider';

export function LoginPage() {
  const { user, loading, openAuthModal } = useAuth();
  if (!loading && !user) {
    window.setTimeout(() => openAuthModal('login'), 0);
    return <Navigate to="/" replace />;
  }
  if (!loading && user) return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/meus-agendamentos'} replace />;
  return <div className="grid min-h-screen place-items-center bg-cream text-ink">Carregando...</div>;
}
