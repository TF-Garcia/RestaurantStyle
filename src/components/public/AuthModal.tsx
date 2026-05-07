import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/AuthProvider';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input, Label } from '../ui/Form';

export function AuthModal() {
  const navigate = useNavigate();
  const { authModal, closeAuthModal, openAuthModal, login, register, forgotPassword, resendVerification } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: 'admin@restaurante.com', password: 'admin123' });
  if (!authModal) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      if (authModal === 'login') {
        const user = await login(form.email, form.password);
        navigate(user.role === 'admin' ? '/admin/dashboard' : '/meus-agendamentos');
      }
      if (authModal === 'register') setMessage(await register(form.name, form.email, form.password));
      if (authModal === 'forgot') setMessage(await forgotPassword(form.email));
    } catch {
      setError(authModal === 'login' ? 'Credenciais invalidas ou conta pendente de verificacao.' : 'Nao foi possivel concluir a solicitacao.');
    }
  };

  const title = authModal === 'login' ? 'Entrar' : authModal === 'register' ? 'Criar conta' : 'Recuperar senha';
  const resend = async () => {
    setError('');
    setMessage('');
    try {
      setMessage(await resendVerification(form.email));
    } catch {
      setError('Nao foi possivel reenviar a confirmacao.');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-ink/65 p-4 backdrop-blur-sm">
      <Card className="relative w-full max-w-md p-7">
        <button onClick={closeAuthModal} className="absolute right-4 top-4 rounded-md p-2 hover:bg-linen" aria-label="Fechar"><X size={18} /></button>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-wine">Acesso seguro</p>
        <h2 className="mt-3 font-display text-4xl font-bold">{title}</h2>
        <form onSubmit={submit} className="mt-6 grid gap-4">
          {message && <p className="rounded-md bg-olive/10 px-4 py-3 text-sm font-semibold text-olive">{message}</p>}
          {error && <p className="rounded-md bg-wine/10 px-4 py-3 text-sm font-semibold text-wine">{error}</p>}
          {authModal === 'register' && <Label label="Nome"><Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Label>}
          <Label label="E-mail"><Input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Label>
          {authModal !== 'forgot' && <Label label="Senha"><Input required type="password" minLength={authModal === 'register' ? 8 : undefined} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></Label>}
          <Button type="submit" className="w-full">{title}</Button>
        </form>
        <div className="mt-5 flex flex-wrap justify-center gap-3 text-sm">
          {authModal !== 'login' && <button className="font-bold text-wine" onClick={() => openAuthModal('login')}>Entrar</button>}
          {authModal !== 'register' && <button className="font-bold text-wine" onClick={() => openAuthModal('register')}>Criar conta</button>}
          {authModal !== 'forgot' && <button className="font-bold text-wine" onClick={() => openAuthModal('forgot')}>Esqueci minha senha</button>}
          {authModal === 'login' && <button className="font-bold text-wine" onClick={() => void resend()}>Reenviar confirmacao</button>}
        </div>
      </Card>
    </div>
  );
}
