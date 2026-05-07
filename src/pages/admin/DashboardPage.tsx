import { CalendarDays, ChefHat, Clock, Tags } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import { formatDate } from '../../utils/format';
import { reservationStatusLabel } from '../../utils/labels';

export function DashboardPage() {
  const { reservations, menuItems, categories, config } = useRestaurantData();
  const pending = reservations.filter((reservation) => reservation.status === 'pending').length;
  const stats = [
    { label: 'Reservas', value: reservations.length, icon: CalendarDays },
    { label: 'Pendentes', value: pending, icon: Clock },
    { label: 'Pratos', value: menuItems.length, icon: ChefHat },
    { label: 'Categorias', value: categories.length, icon: Tags },
  ];

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-wine">Painel</p>
          <h1 className="mt-2 font-display text-4xl font-bold">Visao geral</h1>
        </div>
        <Link to="/" className="text-sm font-semibold text-wine">Ver site publico</Link>
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-5">
              <Icon className="text-wine" />
              <p className="mt-5 text-sm font-semibold text-ink/55">{stat.label}</p>
              <p className="mt-1 font-display text-4xl font-bold">{stat.value}</p>
            </Card>
          );
        })}
      </div>
      <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-black/10 p-5">
            <h2 className="font-display text-3xl font-bold">Proximas reservas</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-linen text-xs uppercase tracking-[0.14em] text-ink/55">
                <tr><th className="p-4">Cliente</th><th>Data</th><th>Pessoas</th><th>Status</th></tr>
              </thead>
              <tbody>
                {reservations.slice(0, 5).map((reservation) => (
                  <tr key={reservation.id} className="border-t border-black/5">
                    <td className="p-4 font-semibold">{reservation.customerName}</td>
                    <td>{formatDate(reservation.date)} as {reservation.time}</td>
                    <td>{reservation.partySize}</td>
                    <td>{reservationStatusLabel[reservation.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="font-display text-3xl font-bold">{config.name}</h2>
          <p className="mt-3 text-sm leading-6 text-ink/65">{config.institutionalText}</p>
          <div className="mt-6 rounded-md bg-ink p-4 text-sm leading-6 text-cream/75">{config.hours}</div>
        </Card>
      </div>
    </div>
  );
}
