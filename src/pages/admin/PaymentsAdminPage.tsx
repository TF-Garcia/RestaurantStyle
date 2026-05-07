import { useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw, Search, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Label, Select } from '../../components/ui/Form';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import type { PaymentStatus, ReservationStatus } from '../../types';
import { getSlotAvailability } from '../../services/availabilityService';
import { formatCurrency, formatDate } from '../../utils/format';
import { paymentMethodLabel, paymentStatusLabel, reservationStatusLabel } from '../../utils/labels';

const reservationStatuses: Array<'all' | ReservationStatus> = ['all', 'pending', 'confirmed', 'cancelled', 'completed', 'no_show'];
const paymentStatuses: Array<'all' | PaymentStatus> = ['all', 'unpaid', 'pending', 'paid', 'failed', 'refunded', 'partially_refunded', 'cancelled'];

export function PaymentsAdminPage() {
  const { reservations, payments, refunds, auditLogs, config, updatePaymentStatusFromWebhook, updateReservationStatus, createRefund } = useRestaurantData();
  const [date, setDate] = useState('');
  const [reservationStatus, setReservationStatus] = useState<'all' | ReservationStatus>('all');
  const [paymentStatus, setPaymentStatus] = useState<'all' | PaymentStatus>('all');

  const filtered = useMemo(
    () => reservations.filter((reservation) => (!date || reservation.date === date) && (reservationStatus === 'all' || reservation.status === reservationStatus) && (paymentStatus === 'all' || reservation.paymentStatus === paymentStatus)),
    [date, paymentStatus, reservationStatus, reservations],
  );

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-wine">Pagamentos</p>
      <h1 className="mt-2 font-display text-4xl font-bold">Pagamentos, estornos e auditoria</h1>
      <Card className="mt-7 p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <Label label="Data"><Input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Label>
          <Label label="Status da reserva">
            <Select value={reservationStatus} onChange={(event) => setReservationStatus(event.target.value as 'all' | ReservationStatus)}>
              {reservationStatuses.map((status) => <option key={status} value={status}>{status === 'all' ? 'Todos' : reservationStatusLabel[status]}</option>)}
            </Select>
          </Label>
          <Label label="Status do pagamento">
            <Select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as 'all' | PaymentStatus)}>
              {paymentStatuses.map((status) => <option key={status} value={status}>{status === 'all' ? 'Todos' : paymentStatusLabel[status]}</option>)}
            </Select>
          </Label>
          <div className="flex items-end"><Button type="button" variant="secondary" className="w-full border-ink/20 bg-ink text-cream"><Search size={18} /> Filtrar</Button></div>
        </div>
      </Card>

      <Card className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="bg-linen text-xs uppercase tracking-[0.14em] text-ink/55">
              <tr><th className="p-4">Reserva</th><th>Data</th><th>Capacidade</th><th>Metodo</th><th>Valor</th><th>Status</th><th>Acoes</th></tr>
            </thead>
            <tbody>
              {filtered.map((reservation) => {
                const payment = payments.find((item) => item.id === reservation.paymentId);
                const availability = getSlotAvailability(config, reservations, reservation.date, reservation.time);
                const definitive = ['cancelled', 'completed', 'no_show'].includes(reservation.status);
                return (
                  <tr key={reservation.id} className="border-t border-black/5 align-top">
                    <td className="p-4"><p className="font-semibold">{reservation.customerName}</p><p className="text-xs text-ink/55">{reservationStatusLabel[reservation.status]} - {reservation.customerEmail}</p></td>
                    <td>{formatDate(reservation.date)} as {reservation.time}</td>
                    <td>{availability.totalCapacity} total - {availability.reservedSeats} reservados - {availability.availableSeats} livres</td>
                    <td>{paymentMethodLabel[reservation.paymentMethod]}</td>
                    <td>{formatCurrency(reservation.amount)}</td>
                    <td>{paymentStatusLabel[reservation.paymentStatus]}</td>
                    <td className="space-y-2 pr-4">
                      {definitive && <span className="rounded-md bg-ink/10 px-3 py-2 text-xs font-bold text-ink">Acao definitiva registrada</span>}
                      {payment && payment.status === 'pending' && <button onClick={() => updatePaymentStatusFromWebhook(payment.id, 'paid')} className="mr-2 inline-flex items-center gap-1 rounded-md bg-olive/10 px-3 py-2 text-xs font-bold text-olive"><CheckCircle2 size={15} /> simular webhook pago</button>}
                      {payment && payment.status === 'paid' && <button onClick={() => createRefund(reservation.id, 'Estorno manual aprovado pelo admin')} className="mr-2 inline-flex items-center gap-1 rounded-md bg-gold/10 px-3 py-2 text-xs font-bold text-wine"><RotateCcw size={15} /> estornar</button>}
                      <button disabled={definitive} onClick={() => updateReservationStatus(reservation.id, 'cancelled')} className="mr-2 inline-flex items-center gap-1 rounded-md bg-wine/10 px-3 py-2 text-xs font-bold text-wine disabled:opacity-40"><XCircle size={15} /> cancelar</button>
                      <button disabled={definitive} onClick={() => updateReservationStatus(reservation.id, 'completed')} className="mr-2 rounded-md bg-olive/10 px-3 py-2 text-xs font-bold text-olive disabled:opacity-40">compareceu</button>
                      <button disabled={definitive} onClick={() => updateReservationStatus(reservation.id, 'no_show')} className="rounded-md bg-ink/10 px-3 py-2 text-xs font-bold text-ink disabled:opacity-40">nao compareceu</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-display text-3xl font-bold">Estornos</h2>
          <div className="mt-4 grid gap-3">
            {refunds.length === 0 && <p className="text-sm text-ink/55">Nenhum estorno registrado.</p>}
            {refunds.map((refund) => <p key={refund.id} className="rounded-md bg-linen p-3 text-sm">{formatCurrency(refund.amount)} - {refund.status} - {refund.reason}</p>)}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-display text-3xl font-bold">Historico de alteracoes</h2>
          <div className="mt-4 max-h-80 overflow-auto">
            {auditLogs.map((log) => <p key={log.id} className="border-b border-black/5 py-2 text-xs">{log.createdAt} - {log.action} - {log.previousValue || '-'} para {log.newValue || '-'}</p>)}
          </div>
        </Card>
      </div>
    </div>
  );
}
