import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { apiFetch } from '../../utils/api';

export function ConfirmEmailPage() {
  const [params] = useSearchParams();
  const [message, setMessage] = useState('Confirmando seu email...');
  const [error, setError] = useState('');
  const token = params.get('token') || '';

  useEffect(() => {
    const confirm = async () => {
      if (!token) {
        setError('Token ausente no link de confirmacao.');
        setMessage('');
        return;
      }
      const response = await apiFetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.message || 'Nao foi possivel confirmar o email.');
        setMessage('');
        return;
      }
      setMessage(data.message || 'Email confirmado. Voce ja pode entrar.');
    };
    void confirm();
  }, [token]);

  return (
    <section className="grid min-h-[calc(100vh-5rem)] place-items-center py-16">
      <Card className="w-full max-w-md p-7 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-wine">Confirmacao de email</p>
        <h1 className="mt-3 font-display text-4xl font-bold">Acesso do cliente</h1>
        {message && <p className="mt-5 rounded-md bg-olive/10 px-4 py-3 text-sm font-semibold text-olive">{message}</p>}
        {error && <p className="mt-5 rounded-md bg-wine/10 px-4 py-3 text-sm font-semibold text-wine">{error}</p>}
        <Link to="/" className="mt-6 inline-flex font-bold text-wine">Voltar ao site</Link>
      </Card>
    </section>
  );
}
