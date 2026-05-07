import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiFetch } from '../utils/api';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'admin';
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  authModal: 'login' | 'register' | 'forgot' | null;
  openAuthModal: (mode: 'login' | 'register' | 'forgot') => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string) => Promise<string>;
  forgotPassword: (email: string) => Promise<string>;
  resendVerification: (email: string) => Promise<string>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const request = async <T,>(path: string, options?: RequestInit): Promise<T> => {
  const response = await apiFetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Nao foi possivel concluir a operacao.');
  return data as T;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModal, setAuthModal] = useState<AuthContextValue['authModal']>(null);

  const refresh = useCallback(async () => {
    try {
      await apiFetch('/api/bootstrap');
      const data = await request<{ user: AuthUser }>('/api/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      authModal,
      openAuthModal: setAuthModal,
      closeAuthModal: () => setAuthModal(null),
      login: async (email, password) => {
        const data = await request<{ user: AuthUser }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
        setUser(data.user);
        setAuthModal(null);
        return data.user;
      },
      register: async (name, email, password) => {
        const data = await request<{ message: string }>('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
        return data.message;
      },
      forgotPassword: async (email) => {
        const data = await request<{ message: string }>('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
        return data.message;
      },
      resendVerification: async (email) => {
        const data = await request<{ message: string }>('/api/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) });
        return data.message;
      },
      logout: async () => {
        await request('/api/auth/logout', { method: 'POST' });
        setUser(null);
      },
    }),
    [authModal, loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
