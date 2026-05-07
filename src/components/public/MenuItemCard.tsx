import { ArrowRight, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Category, MenuItem, RestaurantConfig } from '../../types';
import { formatCurrency, whatsappUrl } from '../../utils/format';
import { Badge } from '../ui/Badge';
import { ExternalButton } from '../ui/Button';
import { Card } from '../ui/Card';
import { useCart } from '../../hooks/CartProvider';

export function MenuItemCard({ item, category, config }: { item: MenuItem; category?: Category; config: RestaurantConfig }) {
  const { addItem } = useCart();
  return (
    <Card className="group overflow-hidden bg-white">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={item.image} alt={item.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        {item.featured && <Badge className="absolute left-4 top-4 bg-ink/80 text-gold backdrop-blur">Destaque</Badge>}
        {!item.available && <span className="absolute inset-0 grid place-items-center bg-ink/70 text-sm font-bold uppercase tracking-[0.2em] text-cream">Indisponivel</span>}
      </div>
      <div className="grid gap-4 p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-olive">{category?.name}</p>
          <h3 className="mt-2 font-display text-2xl font-bold">{item.name}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink/65">{item.description}</p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="font-display text-2xl font-bold text-wine">{formatCurrency(item.price)}</span>
          <Link to={`/cardapio/${item.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-ink hover:text-wine">
            Detalhes <ArrowRight size={16} />
          </Link>
        </div>
        <ExternalButton
          href={whatsappUrl(config.whatsapp, `Ola! Quero pedir: ${item.name}.`)}
          target="_blank"
          rel="noreferrer"
          className="w-full"
          aria-disabled={!item.available}
        >
          <MessageCircle size={16} /> Pedir pelo WhatsApp
        </ExternalButton>
        <button onClick={() => addItem(item)} className="w-full rounded-md border border-ink/15 px-4 py-3 text-sm font-bold text-ink transition hover:bg-linen">
          Adicionar ao carrinho
        </button>
      </div>
    </Card>
  );
}
