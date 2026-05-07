import { Menu, Phone, ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ExternalButton } from '../ui/Button';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import { whatsappUrl } from '../../utils/format';
import { cn } from '../../utils/cn';
import { useAuth } from '../../hooks/AuthProvider';
import { AuthModal } from '../public/AuthModal';
import { useCart } from '../../hooks/CartProvider';

const nav = [
  { to: '/', label: 'Inicio' },
  { to: '/cardapio', label: 'Cardapio' },
  { to: '/reservas', label: 'Reservas' },
  { to: '/sobre', label: 'Sobre' },
  { to: '/eventos', label: 'Eventos' },
  { to: '/contato', label: 'Contato' },
];

export function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { config } = useRestaurantData();
  const { user, logout, openAuthModal } = useAuth();
  const { items } = useCart();
  const whats = whatsappUrl(config.whatsapp, `Ola! Gostaria de falar com ${config.name}.`);

  return (
    <div className="min-h-screen bg-cream text-ink">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[rgba(30,30,28,0.5)] text-cream backdrop-blur-xl">
        <div className="container-page flex h-20 items-center justify-between">
          <NavLink to="/" className="font-display text-2xl font-bold tracking-normal">
            {config.name}
          </NavLink>
          <nav className="hidden items-center gap-7 lg:flex">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn('text-sm font-medium text-cream/72 transition hover:text-gold', isActive && 'text-gold')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            {user?.role === 'admin' ? (
              <NavLink to="/admin/dashboard" className="text-sm font-semibold text-cream/72 hover:text-gold">Painel admin</NavLink>
            ) : user?.role === 'client' ? (
              <>
                <NavLink to="/meus-agendamentos" className="text-sm font-semibold text-cream/72 hover:text-gold">Meus agendamentos</NavLink>
                <button onClick={() => void logout()} className="text-sm font-semibold text-cream/72 hover:text-gold">Sair</button>
              </>
            ) : (
              <button onClick={() => openAuthModal('login')} className="text-sm font-semibold text-cream/72 hover:text-gold">Entrar</button>
            )}
            <ExternalButton href={whats} target="_blank" rel="noreferrer" className="min-h-10 px-4">
              <Phone size={16} /> WhatsApp
            </ExternalButton>
            <NavLink to="/pedido" className="relative rounded-md p-2 text-cream/80 hover:bg-white/10" aria-label="Carrinho"><ShoppingBag size={20} />{items.length > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-gold px-1.5 text-[10px] font-bold text-ink">{items.length}</span>}</NavLink>
          </div>
          <button className="rounded-md p-2 lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="Abrir menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <nav className="container-page grid gap-2 pb-5 lg:hidden">
            {nav.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-cream/80 hover:bg-white/10">
                {item.label}
              </NavLink>
            ))}
            {user?.role === 'admin' ? (
              <NavLink to="/admin/dashboard" onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-cream/80 hover:bg-white/10">Painel admin</NavLink>
            ) : user?.role === 'client' ? (
              <>
                <NavLink to="/meus-agendamentos" onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-cream/80 hover:bg-white/10">Meus agendamentos</NavLink>
                <button onClick={() => { void logout(); setOpen(false); }} className="rounded-md px-3 py-3 text-left text-cream/80 hover:bg-white/10">Sair</button>
              </>
            ) : (
              <button onClick={() => { openAuthModal('login'); setOpen(false); }} className="rounded-md px-3 py-3 text-left text-cream/80 hover:bg-white/10">Entrar</button>
            )}
          </nav>
        )}
      </header>
      <main className="pt-20">
        <Outlet />
      </main>
      <footer className="bg-ink py-12 text-cream">
        <div className="container-page grid gap-8 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <h2 className="font-display text-3xl font-bold">{config.name}</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-cream/70">{config.tagline}</p>
          </div>
          <div>
            <p className="font-semibold text-gold">Endereco</p>
            <p className="mt-3 text-sm leading-6 text-cream/70">{config.address}</p>
          </div>
          <div>
            <p className="font-semibold text-gold">Funcionamento</p>
            <p className="mt-3 text-sm leading-6 text-cream/70">{config.hours}</p>
          </div>
        </div>
      </footer>
      <a
        href={whats}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-glow transition hover:scale-105"
        aria-label="Chamar no WhatsApp"
      >
        <Phone />
      </a>
      <AuthModal />
    </div>
  );
}
