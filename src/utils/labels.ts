import type { PaymentMethod, PaymentStatus, ReservationStatus } from '../types';

export const reservationStatusLabel: Record<ReservationStatus, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Concluida',
  no_show: 'Nao compareceu',
};

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  unpaid: 'Nao pago',
  pending: 'Pendente',
  paid: 'Pago',
  failed: 'Falhou',
  refunded: 'Estornado',
  partially_refunded: 'Parcialmente estornado',
  cancelled: 'Cancelado',
};

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  credit_card: 'Cartao de credito',
  debit_card: 'Cartao de debito',
  pix: 'Pix',
  pay_at_location: 'Pagamento no local',
  pay_at_delivery: 'Pagamento na entrega',
};

export const orderStatusLabel: Record<string, string> = {
  received: 'Recebido',
  preparing: 'Em preparo',
  out_for_delivery: 'Saiu para entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};
