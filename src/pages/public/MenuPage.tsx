import { useMemo, useState } from 'react';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import { MenuItemCard } from '../../components/public/MenuItemCard';
import { cn } from '../../utils/cn';

export function MenuPage() {
  const { categories, menuItems, config } = useRestaurantData();
  const [selected, setSelected] = useState('todos');
  const activeCategories = categories.filter((category) => category.active);
  const filtered = useMemo(
    () => menuItems.filter((item) => item.available && (selected === 'todos' || item.categoryId === selected)),
    [menuItems, selected],
  );

  return (
    <section className="py-16">
      <div className="container-page">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-wine">Cardapio online</p>
          <h1 className="mt-3 font-display text-5xl font-bold">Categorias prontas para qualquer restaurante.</h1>
          <p className="mt-5 leading-7 text-ink/65">Filtre por especialidade, visualize detalhes e envie pedidos diretamente para o WhatsApp configurado.</p>
        </div>
        <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
          <button onClick={() => setSelected('todos')} className={cn('shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition', selected === 'todos' ? 'border-ink bg-ink text-cream' : 'border-black/10 bg-white text-ink')}>
            Todos
          </button>
          {activeCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelected(category.id)}
              className={cn('shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition', selected === category.id ? 'border-ink bg-ink text-cream' : 'border-black/10 bg-white text-ink')}
            >
              {category.name}
            </button>
          ))}
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <MenuItemCard key={item.id} item={item} category={categories.find((category) => category.id === item.categoryId)} config={config} />
          ))}
        </div>
      </div>
    </section>
  );
}
