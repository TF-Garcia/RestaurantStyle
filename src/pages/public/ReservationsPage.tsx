import { ReservationForm } from '../../components/public/ReservationForm';
import { Card } from '../../components/ui/Card';
import { useRestaurantData } from '../../hooks/useRestaurantData';

export function ReservationsPage() {
  const { config } = useRestaurantData();
  return (
    <section className="py-16">
      <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-wine">Reservas</p>
          <h1 className="mt-3 font-display text-5xl font-bold">Garanta sua mesa com poucos dados.</h1>
          <p className="mt-5 text-lg leading-8 text-ink/65">As reservas ficam salvas no painel administrativo, com controle de status e visualizacao dos clientes.</p>
          <div className="mt-8 rounded-lg bg-ink p-6 text-cream shadow-soft">
            <p className="font-semibold text-gold">Capacidade configurada</p>
            <p className="mt-2 text-3xl font-bold">{config.reservationCapacity} lugares</p>
            <p className="mt-4 text-sm leading-6 text-cream/65">{config.hours}</p>
          </div>
        </div>
        <Card className="p-5 md:p-7">
          <ReservationForm />
        </Card>
      </div>
    </section>
  );
}
