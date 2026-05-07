import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Form';
import { formatCurrency } from '../../utils/format';
import { orderStatusLabel, paymentMethodLabel, paymentStatusLabel } from '../../utils/labels';
import { apiFetch } from '../../utils/api';

type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  status: string;
  payment_status: keyof typeof paymentStatusLabel;
  payment_method: keyof typeof paymentMethodLabel;
  total: number;
  created_at: string;
};

export function OrdersAdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const load = async () => {
    const response = await apiFetch('/api/admin/orders');
    if (response.ok) setOrders((await response.json()).orders || []);
  };
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(timer);
  }, []);
  const update = async (id: string, status: string) => {
    await apiFetch(`/api/admin/orders/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    await load();
  };

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-wine">Pedidos</p>
      <h1 className="mt-2 font-display text-4xl font-bold">Pedidos para entrega</h1>
      <Card className="mt-7 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-linen text-xs uppercase tracking-[0.14em] text-ink/55"><tr><th className="p-4">Cliente</th><th>Entrega</th><th>Pagamento</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-black/5">
                  <td className="p-4"><p className="font-bold">{order.customer_name}</p><p className="text-xs text-ink/55">{order.customer_phone}</p></td>
                  <td>{order.delivery_address}</td>
                  <td>{paymentMethodLabel[order.payment_method]} - {paymentStatusLabel[order.payment_status]}</td>
                  <td>{formatCurrency(order.total)}</td>
                  <td>
                    <Select disabled={['delivered', 'cancelled'].includes(order.status)} value={order.status} onChange={(event) => void update(order.id, event.target.value)}>
                      {Object.entries(orderStatusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
