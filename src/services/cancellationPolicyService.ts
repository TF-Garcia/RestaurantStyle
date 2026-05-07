import type { CancellationPolicy, Refund, Reservation } from '../types';

const hoursUntilReservation = (reservation: Reservation) => {
  const reservationDate = new Date(`${reservation.date}T${reservation.time}:00`);
  return (reservationDate.getTime() - Date.now()) / 36e5;
};

export const calculateRefundAmount = (reservation: Reservation, policy: CancellationPolicy, cancelledBy: 'customer' | 'restaurant' | 'admin') => {
  if (cancelledBy === 'restaurant') return reservation.amount;
  const hours = hoursUntilReservation(reservation);
  if (hours >= policy.fullRefundHoursBefore) return reservation.amount;
  if (hours >= policy.partialRefundHoursBefore) return reservation.amount * (1 - policy.lateRetentionPercentage / 100);
  return policy.allowManualLateRefund ? 0 : 0;
};

export const describeCancellationPolicy = (policy: CancellationPolicy) =>
  `Cancelamentos com mais de ${policy.fullRefundHoursBefore}h podem ter estorno total. Entre ${policy.fullRefundHoursBefore}h e ${policy.partialRefundHoursBefore}h, pode haver retencao de ${policy.lateRetentionPercentage}%. Com menos de ${policy.partialRefundHoursBefore}h, o estorno depende da politica da casa.`;

export const summarizeRefund = (refunds: Refund[], reservationId: string) =>
  refunds.filter((refund) => refund.reservationId === reservationId).reduce((sum, refund) => sum + refund.amount, 0);
