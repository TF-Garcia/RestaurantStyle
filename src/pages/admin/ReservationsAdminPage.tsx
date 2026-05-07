import { useRestaurantData } from '../../hooks/useRestaurantData';
import type { ReservationStatus } from '../../types';
import { formatDate } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Form';
import { paymentMethodLabel, reservationStatusLabel } from '../../utils/labels';

const statuses: ReservationStatus[] = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];

export function ReservationsAdminPage() {
  const { reservations, updateReservationStatus } = useRestaurantData();
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-wine">Reservas</p>
      <h1 className="mt-2 font-display text-4xl font-bold">Gerenciamento de reservas</h1>
      <Card className="mt-7 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-linen text-xs uppercase tracking-[0.14em] text-ink/55">
              <tr><th className="p-4">ID</th><th>Data</th><th>Dia</th><th>Horario</th><th>Mesa</th><th>Cliente</th><th>Telefone</th><th>Pessoas</th><th>Forma Pagamento</th><th>Status</th><th>Observacoes</th></tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => (
                <tr key={reservation.id} className="border-t border-black/5 align-top">
                  <td className="p-4 font-mono text-xs">{reservation.id.slice(0, 8)}</td>
                  <td>{formatDate(reservation.date)}</td>
                  <td>{reservation.dayName || '-'}</td>
                  <td>{reservation.time}</td>
                  <td>{reservation.tableName || 'A definir'}</td>
                  <td className="font-semibold">{reservation.customerName}</td>
                  <td>{reservation.customerPhone}</td>
                  <td>{reservation.partySize}</td>
                  <td>{paymentMethodLabel[reservation.paymentMethod]}</td>
                  <td className="pr-4">
                    <Select value={reservation.status} onChange={(event) => updateReservationStatus(reservation.id, event.target.value as ReservationStatus)}>
                      {statuses.map((status) => <option key={status} value={status}>{reservationStatusLabel[status]}</option>)}
                    </Select>
                  </td>
                  <td className="max-w-xs text-ink/65">{reservation.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
