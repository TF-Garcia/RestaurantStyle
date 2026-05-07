import { ArrowRight, CalendarDays, MapPin, MessageCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import { MenuItemCard } from '../../components/public/MenuItemCard';
import { ButtonLink, ExternalButton } from '../../components/ui/Button';
import { Panel } from '../../components/ui/Card';
import { whatsappUrl } from '../../utils/format';

export function HomePage() {
  const { config, menuItems, categories } = useRestaurantData();
  const featured = menuItems.filter((item) => item.featured).slice(0, 3);

  return (
    <>
      <section className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-ink text-cream">
        <img src={config.heroImage} alt={config.name} className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/72 to-ink/18" />
        <div className="container-page relative grid min-h-[calc(100vh-5rem)] content-center py-20">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/35 bg-black/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-gold">
              <Sparkles size={15} /> Restaurante premium reutilizavel
            </p>
            <h1 className="font-display text-5xl font-bold leading-[0.96] text-balance md:text-7xl">{config.name}</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-cream/78">{config.tagline}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink to="/reservas">
                <CalendarDays size={18} /> Reservar mesa
              </ButtonLink>
              <ExternalButton href={whatsappUrl(config.whatsapp, `Ola! Gostaria de fazer um pedido em ${config.name}.`)} target="_blank" rel="noreferrer" variant="secondary">
                <MessageCircle size={18} /> Pedir pelo WhatsApp
              </ExternalButton>
            </div>
          </div>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {['Cardapio editavel', 'Reservas no painel', 'WhatsApp configuravel'].map((item) => (
              <Panel key={item} className="p-5">
                <p className="font-semibold text-gold">{item}</p>
                <p className="mt-2 text-sm leading-6 text-cream/65">Pensado para personalizar e vender para diferentes operacoes gastronomicas.</p>
              </Panel>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container-page">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-wine">Destaques</p>
              <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">Pratos que vendem a experiencia</h2>
            </div>
            <Link to="/cardapio" className="inline-flex items-center gap-2 font-semibold text-wine">
              Ver cardapio completo <ArrowRight size={18} />
            </Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {featured.map((item) => (
              <MenuItemCard key={item.id} item={item} category={categories.find((category) => category.id === item.categoryId)} config={config} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink py-20 text-cream">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">Sobre a casa</p>
            <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">Ambiente versatil para almoco, jantar e eventos.</h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-cream/70">{config.institutionalText}</p>
            <div className="mt-8 flex flex-col gap-3 text-sm text-cream/75 sm:flex-row sm:items-center">
              <span className="inline-flex items-center gap-2"><MapPin size={18} className="text-gold" /> {config.address}</span>
            </div>
          </div>
          <img src={config.aboutImage} alt="Ambiente do restaurante" className="aspect-[4/3] rounded-lg object-cover shadow-soft" />
        </div>
      </section>
    </>
  );
}
