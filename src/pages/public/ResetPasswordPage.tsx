import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Label } from '../../components/ui/Form';
import { apiFetch } from '../../utils/api';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const token = params.get('token') || '';

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    const response = await apiFetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.message || 'Nao foi possivel redefinir a senha.');
      return;
    }
    setMessage('Senha atualizada. Voce ja pode entrar.');
    setPassword('');
  };

  return (
    <section className="grid min-h-[calc(100vh-5rem)] place-items-center py-16">
      <Card className="w-full max-w-md p-7">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-wine">Seguranca</p>
        <h1 className="mt-3 font-display text-4xl font-bold">Redefinir senha</h1>
        <form onSubmit={submit} className="mt-7 grid gap-4">
          {message && <p className="rounded-md bg-olive/10 px-4 py-3 text-sm font-semibold text-olive">{message}</p>}
          {error && <p className="rounded-md bg-wine/10 px-4 py-3 text-sm font-semibold text-wine">{error}</p>}
          <Label label="Nova senha">
            <Input required type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} />
          </Label>
          <Button type="submit" disabled={!token}>Atualizar senha</Button>
          {!token && <p className="text-sm text-wine">Token ausente no link de recuperacao.</p>}
        </form>
        <Link to="/" className="mt-5 inline-flex text-sm font-bold text-wine">Voltar ao site</Link>
      </Card>
    </section>
  );
}
