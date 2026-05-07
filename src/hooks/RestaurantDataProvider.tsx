import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuditLog, PaymentStatus, ReservationStatus } from '../types';
import { calculateRefundAmount } from '../services/cancellationPolicyService';
import { createManualRefund, createPaymentIntent, simulateGatewayWebhook } from '../services/paymentService';
import { buildReservation, expireUnpaidPendingReservations } from '../services/reservationService';
import { restaurantStorage } from '../utils/storage';
import { useAuth } from './AuthProvider';
import { RestaurantContext, type RestaurantContextValue } from './restaurantDataContext';
import { apiFetch } from '../utils/api';

const now = () => new Date().toISOString();

export function RestaurantDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [config, setConfig] = useState(() => restaurantStorage.getConfig());
  const [categories, setCategories] = useState(() => restaurantStorage.getCategories());
  const [menuItems, setMenuItems] = useState(() => restaurantStorage.getMenu());
  const [reservations, setReservations] = useState(() => expireUnpaidPendingReservations(restaurantStorage.getReservations(), restaurantStorage.getConfig()));
  const [payments, setPayments] = useState(() => restaurantStorage.getPayments());
  const [refunds, setRefunds] = useState(() => restaurantStorage.getRefunds());
  const [auditLogs, setAuditLogs] = useState(() => restaurantStorage.getAuditLogs());

  useEffect(() => {
    const loadBootstrap = async () => {
      try {
        const response = await apiFetch('/api/bootstrap');
        if (!response.ok) return;
        const data = await response.json();
        setConfig(data.config);
        setCategories(data.categories || []);
        setMenuItems(data.menuItems || []);
      } catch {
        // O build estatico ainda abre em desenvolvimento, mas a fonte real e a API/SQLite.
      }
    };
    void loadBootstrap();
  }, []);

  useEffect(() => {
    const loadReservations = async () => {
      if (!user) return;
      const endpoint = user.role === 'admin' ? '/api/admin/reservations' : '/api/me/reservations';
      try {
        const response = await apiFetch(endpoint);
        if (!response.ok) return;
        const data = await response.json();
        setReservations(data.reservations || []);
      } catch {
        // LocalStorage remains as a development fallback if the API is offline.
      }
    };
    void loadReservations();
  }, [user]);

  useEffect(() => {
    const loadAdminPayments = async () => {
      if (user?.role !== 'admin') return;
      try {
        const response = await apiFetch('/api/admin/payments');
        if (!response.ok) return;
        const data = await response.json();
        setPayments(data.payments || []);
        setAuditLogs(data.auditLogs || []);
      } catch {
        // Mantem fallback local em desenvolvimento offline.
      }
    };
    void loadAdminPayments();
  }, [user]);

  const addAudit = useCallback((log: Omit<AuditLog, 'id' | 'createdAt'>) => {
    const created = { ...log, id: crypto.randomUUID(), createdAt: now() };
    const next = [created, ...auditLogs];
    setAuditLogs(next);
    restaurantStorage.setAuditLogs(next);
    return created;
  }, [auditLogs]);

  const value = useMemo<RestaurantContextValue>(
    () => ({
      config,
      categories: [...categories].sort((a, b) => a.order - b.order),
      menuItems,
      reservations,
      payments,
      refunds,
      auditLogs,
      updateConfig: (nextConfig) => {
        setConfig(nextConfig);
        restaurantStorage.setConfig(nextConfig);
      },
      saveCategory: (category) => {
        const next = categories.some((item) => item.id === category.id)
          ? categories.map((item) => (item.id === category.id ? category : item))
          : [...categories, category];
        setCategories(next);
        restaurantStorage.setCategories(next);
      },
      removeCategory: (id) => {
        const next = categories.filter((category) => category.id !== id);
        const nextMenu = menuItems.filter((item) => item.categoryId !== id);
        setCategories(next);
        setMenuItems(nextMenu);
        restaurantStorage.setCategories(next);
        restaurantStorage.setMenu(nextMenu);
      },
      saveMenuItem: (menuItem) => {
        const next = menuItems.some((item) => item.id === menuItem.id)
          ? menuItems.map((item) => (item.id === menuItem.id ? menuItem : item))
          : [...menuItems, menuItem];
        setMenuItems(next);
        restaurantStorage.setMenu(next);
      },
      removeMenuItem: (id) => {
        const next = menuItems.filter((item) => item.id !== id);
        setMenuItems(next);
        restaurantStorage.setMenu(next);
      },
      createReservation: async (input) => {
        if (user?.role === 'client') {
          const response = await apiFetch('/api/me/reservations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.message || 'Nao foi possivel criar a reserva.');
          setReservations((current) => [data.reservation, ...current]);
          if (data.payment) setPayments((current) => [data.payment, ...current]);
          return data.reservation;
        }

        const baseReservation = buildReservation(input, config, reservations);
        const payment = createPaymentIntent(baseReservation.id, input.paymentMethod, baseReservation.amount, config.paymentSettings);
        const created = { ...baseReservation, paymentId: payment.id };
        const nextReservations = [created, ...reservations];
        const nextPayments = [payment, ...payments];

        setReservations(nextReservations);
        setPayments(nextPayments);
        restaurantStorage.setReservations(nextReservations);
        restaurantStorage.setPayments(nextPayments);
        return created;
      },
      cancelCustomerReservation: async (id) => {
        const response = await apiFetch(`/api/me/reservations/${id}/cancel`, { method: 'PATCH' });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || 'Nao foi possivel cancelar a reserva.');
        const next = reservations.map((reservation) => (reservation.id === id ? data.reservation : reservation));
        setReservations(next);
      },
      updateReservationStatus: (id, status: ReservationStatus) => {
        if (user?.role === 'admin') {
          void apiFetch(`/api/admin/reservations/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          })
            .then(async (response) => {
              const data = await response.json().catch(() => ({}));
              if (!response.ok) throw new Error(data.message || 'Acao nao permitida.');
              setReservations((current) => current.map((reservation) => (reservation.id === id ? data.reservation : reservation)));
            })
            .catch(() => undefined);
          return;
        }
        const reservation = reservations.find((item) => item.id === id);
        if (status === 'confirmed' && reservation?.paymentMethod !== 'pay_at_location' && reservation?.paymentStatus !== 'paid') return;
        const next = reservations.map((item) => (item.id === id ? { ...item, status, updatedAt: now() } : item));
        setReservations(next);
        restaurantStorage.setReservations(next);
        addAudit({ entityType: 'reservation', entityId: id, action: 'reservation_status_changed', previousValue: reservation?.status, newValue: status, performedBy: 'admin' });
      },
      updatePaymentStatusFromWebhook: (paymentId: string, status: PaymentStatus) => {
        if (user?.role === 'admin' && status === 'paid') {
          void apiFetch(`/api/admin/payments/${paymentId}/sandbox-paid`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
            .then(async (response) => {
              const data = await response.json().catch(() => ({}));
              if (!response.ok) throw new Error(data.message || 'Acao nao permitida.');
              setPayments((current) => current.map((payment) => (payment.id === paymentId ? { ...payment, status: data.payment.status, updatedAt: data.payment.updated_at } : payment)));
              setReservations((current) => current.map((reservation) => (reservation.paymentId === paymentId ? { ...reservation, paymentStatus: 'paid', status: 'confirmed', updatedAt: new Date().toISOString() } : reservation)));
            })
            .catch(() => undefined);
          return;
        }
        const payment = payments.find((item) => item.id === paymentId);
        if (!payment) return;
        const updatedPayment = simulateGatewayWebhook(payment, status);
        const nextPayments = payments.map((item) => (item.id === paymentId ? updatedPayment : item));
        const nextReservations = reservations.map((reservation) => {
          if (reservation.id !== payment.reservationId) return reservation;
          const canConfirm = status === 'paid';
          return {
            ...reservation,
            paymentStatus: status,
            status: canConfirm ? 'confirmed' : reservation.status,
            updatedAt: now(),
          };
        });
        setPayments(nextPayments);
        setReservations(nextReservations);
        restaurantStorage.setPayments(nextPayments);
        restaurantStorage.setReservations(nextReservations);
        addAudit({ entityType: 'payment', entityId: paymentId, action: 'payment_status_webhook', previousValue: payment.status, newValue: status, performedBy: 'simulated_gateway' });
      },
      createRefund: (reservationId, reason, amount) => {
        const reservation = reservations.find((item) => item.id === reservationId);
        const payment = payments.find((item) => item.id === reservation?.paymentId);
        if (!reservation || !payment || payment.status !== 'paid') return;
        if (user?.role === 'admin') {
          void apiFetch(`/api/admin/payments/${payment.id}/refund`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason, amount }),
          })
            .then(async (response) => {
              const data = await response.json().catch(() => ({}));
              if (!response.ok) throw new Error(data.message || 'Estorno nao permitido.');
              setPayments((current) => current.map((item) => (item.id === payment.id ? { ...item, status: data.payment.status, updatedAt: data.payment.updated_at } : item)));
              setReservations((current) => current.map((item) => (item.id === reservation.id ? { ...item, paymentStatus: data.payment.status, updatedAt: new Date().toISOString() } : item)));
            })
            .catch(() => undefined);
          return;
        }
        const refundAmount = amount ?? calculateRefundAmount(reservation, config.cancellationPolicy, 'admin');
        const refund = createManualRefund(payment, reservation.id, refundAmount, reason, 'admin');
        const nextRefunds = [refund, ...refunds];
        const paymentStatus: PaymentStatus = refundAmount >= payment.amount ? 'refunded' : 'partially_refunded';
        const nextPayments = payments.map((item) => (item.id === payment.id ? simulateGatewayWebhook(item, paymentStatus, 'admin_refund') : item));
        const nextReservations = reservations.map((item) => (item.id === reservation.id ? { ...item, paymentStatus, updatedAt: now() } : item));
        setRefunds(nextRefunds);
        setPayments(nextPayments);
        setReservations(nextReservations);
        restaurantStorage.setRefunds(nextRefunds);
        restaurantStorage.setPayments(nextPayments);
        restaurantStorage.setReservations(nextReservations);
        addAudit({ entityType: 'refund', entityId: refund.id, action: 'manual_refund_processed', newValue: String(refundAmount), performedBy: 'admin' });
      },
    }),
    [addAudit, auditLogs, categories, config, menuItems, payments, refunds, reservations, user],
  );

  return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>;
}
