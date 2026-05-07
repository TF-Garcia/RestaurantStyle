import { CalendarDays, Users, Wine } from 'lucide-react';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import { ButtonLink } from '../../components/ui/Button';

const events = [
  { title: 'Sala privativa', text: 'Jantares reservados, reunioes e celebracoes intimistas.', icon: Users },
  { title: 'Eventos corporativos', text: 'Menus fechados, reserva por periodo e atendimento dedicado.', icon: CalendarDays },
  { title: 'Experiencias especiais', text: 'Degustacoes, harmonizacoes e menus sazonais.', icon: Wine },
];

export function EventsPage() {
  const { config } = useRestaurantData();
  return (
    <section className="py-16">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-lg bg-ink p-8 text-cream shadow-soft md:p-12">
          <img src={config.socialImage} alt="Evento no restaurante" className="absolute inset-0 h-full w-full object-cover opacity-28" />
          <div className="relative max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">Ambientes e eventos</p>
            <h1 className="mt-3 font-display text-5xl font-bold">Um espaco pronto para ocasioes importantes.</h1>
            <p className="mt-5 leading-7 text-cream/74">Destaque ambientes, formatos de reserva e opcoes comerciais para grupos.</p>
          </div>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {events.map((event) => {
            const Icon = event.icon;
            return (
              <div key={event.title} className="rounded-lg border border-black/10 bg-white p-6 shadow-soft">
                <Icon className="text-wine" />
                <h2 className="mt-5 font-display text-3xl font-bold">{event.title}</h2>
                <p className="mt-3 text-sm leading-6 text-ink/65">{event.text}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-10 text-center">
          <ButtonLink to="/reservas">Reservar para evento</ButtonLink>
        </div>
      </div>
    </section>
  );
}
