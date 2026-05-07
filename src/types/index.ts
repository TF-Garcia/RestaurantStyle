export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded' | 'cancelled';
export type PaymentMethod = 'credit_card' | 'debit_card' | 'pix' | 'pay_at_location' | 'pay_at_delivery';
export type RefundStatus = 'requested' | 'approved' | 'processed' | 'failed' | 'cancelled';
export type AuditEntityType = 'reservation' | 'payment' | 'refund' | 'config';

export type ReservationInterval = {
  startTime: string;
  endTime: string;
};

export type OpeningHour = {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  reservationIntervals: ReservationInterval[];
  capacityPerSlot: number;
  blockedSlots: string[];
};

export type ReservationSettings = {
  defaultCapacityPerSlot: number;
  averageDurationMinutes: number;
  slotStepMinutes: number;
  requirePaymentToConfirm: boolean;
  autoConfirmPayAtLocation: boolean;
};

export type PaymentSettings = {
  enabled: boolean;
  reservationFee: number;
  acceptedMethods: PaymentMethod[];
  provider: 'simulated' | 'mercado_pago' | 'mercado_pago_sandbox' | 'stripe' | 'pagarme' | 'asaas';
  allowPayAtLocation: boolean;
  expireUnpaidReservations: boolean;
  unpaidExpirationMinutes: number;
};

export type CancellationPolicy = {
  fullRefundHoursBefore: number;
  partialRefundHoursBefore: number;
  lateRetentionPercentage: number;
  noShowRetentionPercentage: number;
  allowManualLateRefund: boolean;
};

export type RestaurantConfig = {
  name: string;
  tagline: string;
  whatsapp: string;
  address: string;
  hours: string;
  openingHours: OpeningHour[];
  reservationSettings: ReservationSettings;
  paymentSettings: PaymentSettings;
  cancellationPolicy: CancellationPolicy;
  instagram: string;
  heroImage: string;
  aboutImage: string;
  logoUrl?: string;
  institutionalText: string;
  reservationCapacity: number;
  socialImage: string;
};

export type Category = {
  id: string;
  name: string;
  description: string;
  active: boolean;
  order: number;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
  featured: boolean;
  available: boolean;
};

export type Reservation = {
  id: string;
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  date: string;
  dayName?: string;
  time: string;
  tableName?: string;
  partySize: number;
  notes: string;
  status: ReservationStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentId?: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
};

export type AuditLog = {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  action: string;
  previousValue?: string;
  newValue?: string;
  performedBy: string;
  createdAt: string;
};

export type Payment = {
  id: string;
  reservationId: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  provider: PaymentSettings['provider'];
  providerReference: string;
  checkoutUrl?: string;
  createdAt: string;
  updatedAt: string;
  auditTrail: AuditLog[];
};

export type Refund = {
  id: string;
  paymentId: string;
  reservationId: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  requestedBy: string;
  createdAt: string;
  processedAt?: string;
};
