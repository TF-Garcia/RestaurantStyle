import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Label, Select, Textarea } from '../../components/ui/Form';
import { useAuth } from '../../hooks/AuthProvider';
import { useCart } from '../../hooks/CartProvider';
import type { PaymentMethod } from '../../types';
import { formatCurrency } from '../../utils/format';
import { orderStatusLabel, paymentMethodLabel, paymentStatusLabel } from '../../utils/labels';
import { apiFetch } from '../../utils/api';

export function CheckoutPage() {
  const { user, openAuthModal } = useAuth();
  const { items, total, removeItem, clear } = useCart();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ customerPhone: '', deliveryAddress: '', deliveryNotes: '', paymentMethod: 'pix' as PaymentMethod });
  if (!items.length && !message) return <Navigate to="/cardapio" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!user) {
      openAuthModal('login');
      return;
    }
    const response = await apiFetch('/api/me/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, items: items.map((cartItem) => ({ menuItemId: cartItem.item.id, quantity: cartItem.quantity })) }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.message || 'Nao foi possivel enviar o pedido.');
      return;
    }
    clear();
    const orderStatus = String(data.order.status);
    const paymentStatus = String(data.order.payment_status) as keyof typeof paymentStatusLabel;
    setMessage(`Pedido recebido. Status: ${orderStatusLabel[orderStatus] || orderStatus}. Pagamento: ${paymentStatusLabel[paymentStatus] || data.order.payment_status}.`);
  };

  return (
    <section className="py-16">
      <div className="container-page grid gap-8 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-wine">Pedido online</p>
          <h1 className="mt-3 font-display text-5xl font-bold">Entrega</h1>
          <Card className="mt-7 p-5">
            {message && <p className="rounded-md bg-olive/10 p-4 text-sm font-bold text-olive">{message}</p>}
            {error && <p className="rounded-md bg-wine/10 p-4 text-sm font-bold text-wine">{error}</p>}
            <form onSubmit={submit} className="mt-4 grid gap-4">
              <Label label="Telefone"><Input required value={form.customerPhone} onChange={(event) => setForm({ ...form, customerPhone: event.target.value })} /></Label>
              <Label label="Endereco de entrega"><Input required value={form.deliveryAddress} onChange={(event) => setForm({ ...form, deliveryAddress: event.target.value })} /></Label>
              <Label label="Observacoes da entrega"><Textarea value={form.deliveryNotes} onChange={(event) => setForm({ ...form, deliveryNotes: event.target.value })} /></Label>
              <Label label="Forma de pagamento">
                <Select value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value as PaymentMethod })}>
                  {(['pix', 'credit_card', 'debit_card', 'pay_at_delivery'] as PaymentMethod[]).map((method) => <option key={method} value={method}>{paymentMethodLabel[method]}</option>)}
                </Select>
              </Label>
              <Button type="submit">Enviar pedido</Button>
            </form>
          </Card>
        </div>
        <Card className="h-fit p-5">
          <h2 className="font-display text-3xl font-bold">Carrinho</h2>
          <div className="mt-4 grid gap-3">
            {items.map((cartItem) => (
              <div key={cartItem.item.id} className="flex items-center justify-between gap-3 border-b border-black/5 pb-3">
                <div><p className="font-bold">{cartItem.item.name}</p><p className="text-sm text-ink/55">{cartItem.quantity} x {formatCurrency(cartItem.item.price)}</p></div>
                <button onClick={() => removeItem(cartItem.item.id)} className="text-sm font-bold text-wine">Remover</button>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xl font-bold">Total: {formatCurrency(total + 8)}</p>
          <p className="mt-1 text-xs text-ink/55">Inclui taxa de entrega fixa de {formatCurrency(8)}.</p>
        </Card>
      </div>
    </section>
  );
}
