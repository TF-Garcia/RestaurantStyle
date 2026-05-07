import { Instagram, MapPin, Phone } from 'lucide-react';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import { ExternalButton } from '../../components/ui/Button';
import { whatsappUrl } from '../../utils/format';

export function ContactPage() {
  const { config } = useRestaurantData();
  return (
    <section className="py-16">
      <div className="container-page grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-wine">Contato</p>
          <h1 className="mt-3 font-display text-5xl font-bold">Localizacao, horarios e canais oficiais.</h1>
          <div className="mt-8 grid gap-4">
            <p className="flex gap-3 leading-7 text-ink/70"><MapPin className="mt-1 text-wine" /> {config.address}</p>
            <p className="flex gap-3 leading-7 text-ink/70"><Phone className="mt-1 text-wine" /> WhatsApp: {config.whatsapp}</p>
            <p className="flex gap-3 leading-7 text-ink/70"><Instagram className="mt-1 text-wine" /> {config.instagram}</p>
          </div>
          <ExternalButton href={whatsappUrl(config.whatsapp, `Ola! Vim pelo site de ${config.name}.`)} target="_blank" rel="noreferrer" className="mt-8">
            Chamar no WhatsApp
          </ExternalButton>
        </div>
        <div className="min-h-[420px] overflow-hidden rounded-lg border border-black/10 bg-linen shadow-soft">
          <iframe
            title="Mapa"
            src={`https://www.google.com/maps?q=${encodeURIComponent(config.address)}&output=embed`}
            className="h-full min-h-[420px] w-full"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
