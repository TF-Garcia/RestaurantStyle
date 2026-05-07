import { initialCategories, initialConfig, initialMenuItems, initialPayments, initialRefunds, initialReservations } from '../data/initialData';
import type { AuditLog, Category, MenuItem, Payment, Refund, Reservation, RestaurantConfig } from '../types';

const keys = {
  config: 'restaurant-style:config',
  categories: 'restaurant-style:categories',
  menu: 'restaurant-style:menu',
  reservations: 'restaurant-style:reservations',
  payments: 'restaurant-style:payments',
  refunds: 'restaurant-style:refunds',
  auditLogs: 'restaurant-style:auditLogs',
  auth: 'restaurant-style:auth',
};

const read = <T,>(key: string, fallback: T): T => {
  const raw = localStorage.getItem(key);
  if (!raw) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
};

const write = <T,>(key: string, value: T) => localStorage.setItem(key, JSON.stringify(value));

export const restaurantStorage = {
  getConfig: () => {
    const stored = read<RestaurantConfig>(keys.config, initialConfig);
    return { ...initialConfig, ...stored, openingHours: stored.openingHours || initialConfig.openingHours, reservationSettings: { ...initialConfig.reservationSettings, ...stored.reservationSettings }, paymentSettings: { ...initialConfig.paymentSettings, ...stored.paymentSettings }, cancellationPolicy: { ...initialConfig.cancellationPolicy, ...stored.cancellationPolicy } };
  },
  setConfig: (value: RestaurantConfig) => write(keys.config, value),
  getCategories: () => read<Category[]>(keys.categories, initialCategories),
  setCategories: (value: Category[]) => write(keys.categories, value),
  getMenu: () => read<MenuItem[]>(keys.menu, initialMenuItems),
  setMenu: (value: MenuItem[]) => write(keys.menu, value),
  getReservations: () => read<Reservation[]>(keys.reservations, initialReservations).map((reservation) => {
    const legacy = reservation as Reservation & { name?: string; phone?: string; people?: number };
    return {
      ...reservation,
      customerName: reservation.customerName || legacy.name || '',
      customerPhone: reservation.customerPhone || legacy.phone || '',
      customerEmail: reservation.customerEmail || '',
      partySize: reservation.partySize || legacy.people || 1,
      status: ['pendente', 'confirmada', 'cancelada'].includes(String(reservation.status))
        ? ({ pendente: 'pending', confirmada: 'confirmed', cancelada: 'cancelled' } as const)[reservation.status as 'pendente' | 'confirmada' | 'cancelada']
        : reservation.status,
      paymentStatus: reservation.paymentStatus || 'unpaid',
      paymentMethod: reservation.paymentMethod || 'pay_at_location',
      paymentId: reservation.paymentId || (reservation.id === 'res-001' ? 'pay-001' : reservation.id === 'res-002' ? 'pay-002' : undefined),
      amount: reservation.amount || 0,
      updatedAt: reservation.updatedAt || reservation.createdAt || new Date().toISOString(),
    };
  }),
  setReservations: (value: Reservation[]) => write(keys.reservations, value),
  getPayments: () => read<Payment[]>(keys.payments, initialPayments),
  setPayments: (value: Payment[]) => write(keys.payments, value),
  getRefunds: () => read<Refund[]>(keys.refunds, initialRefunds),
  setRefunds: (value: Refund[]) => write(keys.refunds, value),
  getAuditLogs: () => read<AuditLog[]>(keys.auditLogs, []),
  setAuditLogs: (value: AuditLog[]) => write(keys.auditLogs, value),
  isAuthenticated: () => localStorage.getItem(keys.auth) === 'true',
  setAuthenticated: (value: boolean) => localStorage.setItem(keys.auth, String(value)),
};
