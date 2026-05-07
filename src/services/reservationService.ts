import type { PaymentMethod, Reservation, RestaurantConfig } from '../types';
import { validateReservationAvailability } from './availabilityService';

type CreateReservationInput = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  date: string;
  time: string;
  partySize: number;
  notes: string;
  paymentMethod: PaymentMethod;
};

export const buildReservation = (
  input: CreateReservationInput,
  config: RestaurantConfig,
  reservations: Reservation[],
) => {
  const validation = validateReservationAvailability(config, reservations, input.date, input.time, input.partySize);
  if (!validation.valid) throw new Error(validation.message);
  const amount = config.paymentSettings.enabled ? config.paymentSettings.reservationFee * input.partySize : 0;
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    ...input,
    status: input.paymentMethod === 'pay_at_location' && config.reservationSettings.autoConfirmPayAtLocation ? 'confirmed' : 'pending',
    paymentStatus: input.paymentMethod === 'pay_at_location' || amount === 0 ? 'unpaid' : 'pending',
    amount,
    createdAt: now,
    updatedAt: now,
  } satisfies Reservation;
};

export const expireUnpaidPendingReservations = (reservations: Reservation[], config: RestaurantConfig): Reservation[] => {
  if (!config.paymentSettings.expireUnpaidReservations) return reservations;
  const expirationMs = config.paymentSettings.unpaidExpirationMinutes * 60 * 1000;
  const currentTime = Date.now();

  return reservations.map((reservation) => {
    const shouldExpire =
      reservation.status === 'pending' &&
      ['unpaid', 'pending'].includes(reservation.paymentStatus) &&
      currentTime - new Date(reservation.createdAt).getTime() > expirationMs;

    return shouldExpire ? { ...reservation, status: 'cancelled' as const, paymentStatus: 'cancelled' as const, updatedAt: new Date().toISOString() } : reservation;
  });
};
