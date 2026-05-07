import { CalendarDays, ChefHat, CreditCard, LayoutDashboard, LogOut, Settings, ShoppingBag, Tags } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { restaurantStorage } from '../../utils/storage';
import { cn } from '../../utils/cn';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import { useAuth } from '../../hooks/AuthProvider';

const links = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/reservas', label: 'Reservas', icon: CalendarDays },
  { to: '/admin/pagamentos', label: 'Pagamentos', icon: CreditCard },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { to: '/admin/cardapio', label: 'Cardapio', icon: ChefHat },
  { to: '/admin/categorias', label: 'Categorias', icon: Tags },
  { to: '/admin/configuracoes', label: 'Configuracoes', icon: Settings },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const { config } = useRestaurantData();
  const { logout: authLogout } = useAuth();

  const logout = async () => {
    await authLogout();
    restaurantStorage.setAuthenticated(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f4efe6] text-ink lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="border-b border-black/10 bg-ink p-5 text-cream lg:min-h-screen lg:border-b-0">
        <div className="flex items-center justify-between lg:block">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-gold">Admin</p>
            <h1 className="mt-1 font-display text-3xl font-bold">{config.name}</h1>
          </div>
          <button onClick={logout} className="rounded-md p-2 text-cream/70 hover:bg-white/10 lg:hidden" aria-label="Sair">
            <LogOut />
          </button>
        </div>
        <nav className="mt-8 grid gap-2">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn('flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold text-cream/70 transition hover:bg-white/10 hover:text-cream', isActive && 'bg-gold text-ink hover:bg-gold hover:text-ink')
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <button onClick={logout} className="mt-8 hidden w-full items-center justify-center gap-2 rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-cream/70 hover:bg-white/10 lg:flex">
          <LogOut size={18} /> Sair
        </button>
      </aside>
      <main className="p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
