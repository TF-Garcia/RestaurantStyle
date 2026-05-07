import { createContext } from 'react';
import type { AuditLog, Category, MenuItem, Payment, PaymentStatus, Refund, Reservation, ReservationStatus, RestaurantConfig } from '../types';

export type RestaurantContextValue = {
  config: RestaurantConfig;
  categories: Category[];
  menuItems: MenuItem[];
  reservations: Reservation[];
  payments: Payment[];
  refunds: Refund[];
  auditLogs: AuditLog[];
  updateConfig: (config: RestaurantConfig) => void;
  saveCategory: (category: Category) => void;
  removeCategory: (id: string) => void;
  saveMenuItem: (item: MenuItem) => void;
  removeMenuItem: (id: string) => void;
  createReservation: (reservation: Omit<Reservation, 'id' | 'status' | 'paymentStatus' | 'paymentId' | 'amount' | 'createdAt' | 'updatedAt'>) => Promise<Reservation>;
  cancelCustomerReservation: (id: string) => Promise<void>;
  updateReservationStatus: (id: string, status: ReservationStatus) => void;
  updatePaymentStatusFromWebhook: (paymentId: string, status: PaymentStatus) => void;
  createRefund: (reservationId: string, reason: string, amount?: number) => void;
};

export const RestaurantContext = createContext<RestaurantContextValue | null>(null);
