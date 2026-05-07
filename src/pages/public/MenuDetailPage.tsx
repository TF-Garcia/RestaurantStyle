import { ArrowLeft, MessageCircle } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import { ExternalButton } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency, whatsappUrl } from '../../utils/format';

export function MenuDetailPage() {
  const { id } = useParams();
  const { menuItems, categories, config } = useRestaurantData();
  const item = menuItems.find((menuItem) => menuItem.id === id);
  if (!item) return <Navigate to="/cardapio" replace />;
  const category = categories.find((current) => current.id === item.categoryId);

  return (
    <section className="py-16">
      <div className="container-page">
        <Link to="/cardapio" className="inline-flex items-center gap-2 text-sm font-semibold text-wine">
          <ArrowLeft size={18} /> Voltar ao cardapio
        </Link>
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <img src={item.image} alt={item.name} className="aspect-[4/3] w-full rounded-lg object-cover shadow-soft" />
          <div>
            <Badge>{category?.name}</Badge>
            <h1 className="mt-5 font-display text-5xl font-bold">{item.name}</h1>
            <p className="mt-5 text-lg leading-8 text-ink/68">{item.description}</p>
            <p className="mt-7 font-display text-4xl font-bold text-wine">{formatCurrency(item.price)}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ExternalButton href={whatsappUrl(config.whatsapp, `Ola! Quero pedir: ${item.name}.`)} target="_blank" rel="noreferrer">
                <MessageCircle size={18} /> Pedir pelo WhatsApp
              </ExternalButton>
              <Link to="/reservas" className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink/20 px-5 py-2 text-sm font-semibold hover:bg-ink hover:text-cream">
                Reservar mesa
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
