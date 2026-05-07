import { Navigate, Route, Routes } from 'react-router-dom';
import { RestaurantDataProvider } from './hooks/RestaurantDataProvider';
import { AuthProvider } from './hooks/AuthProvider';
import { CartProvider } from './hooks/CartProvider';
import { PublicLayout } from './components/layout/PublicLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { ProtectedRoute } from './components/admin/ProtectedRoute';
import { HomePage } from './pages/public/HomePage';
import { MenuPage } from './pages/public/MenuPage';
import { MenuDetailPage } from './pages/public/MenuDetailPage';
import { ReservationsPage } from './pages/public/ReservationsPage';
import { AboutPage } from './pages/public/AboutPage';
import { EventsPage } from './pages/public/EventsPage';
import { ContactPage } from './pages/public/ContactPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { MyAppointmentsPage } from './pages/public/MyAppointmentsPage';
import { CheckoutPage } from './pages/public/CheckoutPage';
import { OrdersAdminPage } from './pages/admin/OrdersAdminPage';
import { ResetPasswordPage } from './pages/public/ResetPasswordPage';
import { ConfirmEmailPage } from './pages/public/ConfirmEmailPage';
import { LoginPage } from './pages/admin/LoginPage';
import { DashboardPage } from './pages/admin/DashboardPage';
import { ReservationsAdminPage } from './pages/admin/ReservationsAdminPage';
import { PaymentsAdminPage } from './pages/admin/PaymentsAdminPage';
import { MenuAdminPage } from './pages/admin/MenuAdminPage';
import { CategoriesAdminPage } from './pages/admin/CategoriesAdminPage';
import { SettingsAdminPage } from './pages/admin/SettingsAdminPage';

export default function App() {
  return (
    <AuthProvider>
    <CartProvider>
    <RestaurantDataProvider>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="cardapio" element={<MenuPage />} />
          <Route path="cardapio/:id" element={<MenuDetailPage />} />
          <Route path="reservas" element={<ReservationsPage />} />
          <Route path="sobre" element={<AboutPage />} />
          <Route path="eventos" element={<EventsPage />} />
          <Route path="contato" element={<ContactPage />} />
          <Route path="pedido" element={<CheckoutPage />} />
          <Route path="redefinir-senha" element={<ResetPasswordPage />} />
          <Route path="confirmar-email" element={<ConfirmEmailPage />} />
        </Route>

        <Route path="login" element={<LoginPage />} />
        <Route path="cadastro" element={<RegisterPage />} />
        <Route path="admin/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute role="client" />}>
          <Route element={<PublicLayout />}>
            <Route path="meus-agendamentos" element={<MyAppointmentsPage />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute role="admin" />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="reservas" element={<ReservationsAdminPage />} />
            <Route path="pagamentos" element={<PaymentsAdminPage />} />
            <Route path="pedidos" element={<OrdersAdminPage />} />
            <Route path="cardapio" element={<MenuAdminPage />} />
            <Route path="categorias" element={<CategoriesAdminPage />} />
            <Route path="configuracoes" element={<SettingsAdminPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </RestaurantDataProvider>
    </CartProvider>
    </AuthProvider>
  );
}
