import type { AuditLog, Payment, PaymentMethod, PaymentSettings, PaymentStatus, Refund } from '../types';

const now = () => new Date().toISOString();

export const createPaymentIntent = (reservationId: string, method: PaymentMethod, amount: number, settings: PaymentSettings): Payment => {
  const id = crypto.randomUUID();
  const payment: Payment = {
    id,
    reservationId,
    method,
    amount,
    status: method === 'pay_at_location' ? 'unpaid' : 'pending',
    provider: settings.provider,
    providerReference: `sim-${method}-${id.slice(0, 8)}`,
    checkoutUrl: method === 'pay_at_location' ? undefined : `/checkout/simulado/${id}`,
    createdAt: now(),
    updatedAt: now(),
    auditTrail: [
      {
        id: crypto.randomUUID(),
        entityType: 'payment',
        entityId: id,
        action: 'payment_intent_created',
        newValue: method === 'pay_at_location' ? 'unpaid' : 'pending',
        performedBy: 'system',
        createdAt: now(),
      },
    ],
  };

  return payment;
};

// Pagamentos reais devem ser processados somente por backend seguro.
// A confirmacao real deve vir por webhook do gateway, nunca por acao confiada ao cliente.
// Dados de cartao nunca devem passar pelo frontend do restaurante.
export const simulateGatewayWebhook = (payment: Payment, nextStatus: PaymentStatus, performedBy = 'simulated_gateway') => {
  const log: AuditLog = {
    id: crypto.randomUUID(),
    entityType: 'payment',
    entityId: payment.id,
    action: 'payment_status_webhook',
    previousValue: payment.status,
    newValue: nextStatus,
    performedBy,
    createdAt: now(),
  };

  return { ...payment, status: nextStatus, updatedAt: now(), auditTrail: [log, ...payment.auditTrail] };
};

// Estornos reais devem ser executados via API segura do provedor de pagamento.
export const createManualRefund = (payment: Payment, reservationId: string, amount: number, reason: string, requestedBy: string): Refund => ({
  id: crypto.randomUUID(),
  paymentId: payment.id,
  reservationId,
  amount,
  reason,
  status: 'processed',
  requestedBy,
  createdAt: now(),
  processedAt: now(),
});
