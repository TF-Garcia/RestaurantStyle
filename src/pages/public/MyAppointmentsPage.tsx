import { useEffect, useState } from 'react';
import { CalendarX } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/AuthProvider';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import { describeCancellationPolicy } from '../../services/cancellationPolicyService';
import { formatCurrency, formatDate } from '../../utils/format';
import { orderStatusLabel, paymentMethodLabel, paymentStatusLabel, reservationStatusLabel } from '../../utils/labels';
import { apiFetch } from '../../utils/api';

type CustomerOrder = {
  id: string;
  status: string;
  payment_status: keyof typeof paymentStatusLabel;
  payment_method: keyof typeof paymentMethodLabel;
  delivery_address: string;
  total: number;
};

export function MyAppointmentsPage() {
  const { user } = useAuth();
  const { reservations, config, cancelCustomerReservation } = useRestaurantData();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const userReservations = reservations.filter((reservation) => !reservation.userId || reservation.userId === user?.id);
  const now = new Date();
  const future = userReservations.filter((reservation) => new Date(`${reservation.date}T${reservation.time}:00`) >= now && reservation.status !== 'cancelled');
  const past = userReservations.filter((reservation) => new Date(`${reservation.date}T${reservation.time}:00`) < now || reservation.status === 'cancelled');

  useEffect(() => {
    const loadOrders = async () => {
      const response = await apiFetch('/api/me/orders');
      if (response.ok) setOrders((await response.json()).orders || []);
    };
    void loadOrders();
  }, []);

  const cancel = async (id: string) => {
    await cancelCustomerReservation(id);
  };

  const renderReservation = (reservationId: string) => {
    const reservation = userReservations.find((item) => item.id === reservationId);
    if (!reservation) return null;
    return (
      <Card key={reservation.id} className="p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="font-display text-2xl font-bold">{formatDate(reservation.date)} as {reservation.time}</p>
            <p className="mt-2 text-sm text-ink/60">{reservation.partySize} pessoa(s) - {reservation.notes || 'Sem observacoes'}</p>
            <p className="mt-3 text-sm">Reserva: <strong>{reservationStatusLabel[reservation.status]}</strong> - Pagamento: <strong>{paymentStatusLabel[reservation.paymentStatus]}</strong></p>
            <p className="mt-1 text-sm">Metodo: {paymentMethodLabel[reservation.paymentMethod]} - Valor: {formatCurrency(reservation.amount)}</p>
          </div>
          {['pending', 'confirmed'].includes(reservation.status) && (
            <Button type="button" variant="danger" onClick={() => void cancel(reservation.id)}>
              <CalendarX size={18} /> Cancelar
            </Button>
          )}
        </div>
      </Card>
    );
  };

  return (
    <section className="py-16">
      <div className="container-page">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-wine">Area do cliente</p>
        <h1 className="mt-3 font-display text-5xl font-bold">Meus Agendamentos</h1>
        <p className="mt-4 max-w-3xl leading-7 text-ink/65">{describeCancellationPolicy(config.cancellationPolicy)}</p>

        <div className="mt-10 grid gap-8">
          <div>
            <h2 className="font-display text-3xl font-bold">Reservas futuras</h2>
            <div className="mt-4 grid gap-4">
              {future.length ? future.map((reservation) => renderReservation(reservation.id)) : <p className="text-sm text-ink/55">Nenhuma reserva futura.</p>}
            </div>
          </div>
          <div>
            <h2 className="font-display text-3xl font-bold">Historico de reservas</h2>
            <div className="mt-4 grid gap-4">
              {past.length ? past.map((reservation) => renderReservation(reservation.id)) : <p className="text-sm text-ink/55">Nenhuma reserva passada.</p>}
            </div>
          </div>
          <div>
            <h2 className="font-display text-3xl font-bold">Meus pedidos</h2>
            <div className="mt-4 grid gap-4">
              {orders.length ? orders.map((order) => (
                <Card key={order.id} className="p-5">
                  <p className="font-display text-2xl font-bold">{orderStatusLabel[order.status] || order.status}</p>
                  <p className="mt-2 text-sm text-ink/60">Entrega: {order.delivery_address}</p>
                  <p className="mt-2 text-sm">Pagamento: <strong>{paymentStatusLabel[order.payment_status]}</strong> - {paymentMethodLabel[order.payment_method]}</p>
                  <p className="mt-1 text-sm">Total: {formatCurrency(order.total)}</p>
                </Card>
              )) : <p className="text-sm text-ink/55">Nenhum pedido registrado.</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
