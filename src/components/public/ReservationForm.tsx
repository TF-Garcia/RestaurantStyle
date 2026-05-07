import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CalendarCheck, CreditCard, Landmark, MessageCircle, QrCode } from 'lucide-react';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import { describeCancellationPolicy } from '../../services/cancellationPolicyService';
import { getReservationSlots, getSlotAvailability, validateReservationAvailability } from '../../services/availabilityService';
import type { PaymentMethod } from '../../types';
import { formatCurrency, whatsappUrl } from '../../utils/format';
import { Button, ExternalButton } from '../ui/Button';
import { Input, Label, Select, Textarea } from '../ui/Form';
import { useAuth } from '../../hooks/AuthProvider';
import { Link } from 'react-router-dom';
import { paymentMethodLabel, paymentStatusLabel, reservationStatusLabel } from '../../utils/labels';

export function ReservationForm() {
  const { createReservation, config, reservations, payments } = useRestaurantData();
  const { user } = useAuth();
  const [done, setDone] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    customerName: user?.name || '',
    customerPhone: '',
    customerEmail: user?.email || '',
    date: '',
    time: '',
    partySize: '2',
    notes: '',
    paymentMethod: 'pix' as PaymentMethod,
  });

  const slots = useMemo(() => getReservationSlots(config, form.date), [config, form.date]);
  const availability = form.date && form.time ? getSlotAvailability(config, reservations, form.date, form.time) : null;
  const reservationFee = ['pix', 'credit_card', 'debit_card'].includes(form.paymentMethod) ? config.paymentSettings.reservationFee : 0;
  const payment = payments.find((item) => item.reservationId === done);

  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    if (user) setForm((current) => ({ ...current, customerName: user.name, customerEmail: user.email }));
  }, [user]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!user) {
      setError('Entre ou crie uma conta para reservar.');
      return;
    }
    const validation = validateReservationAvailability(config, reservations, form.date, form.time, Number(form.partySize));
    if (!validation.valid) {
      setError(validation.message);
      return;
    }
    if (form.paymentMethod === 'pay_at_location' && !config.paymentSettings.allowPayAtLocation) {
      setError('Pagamento no local nao esta habilitado para este restaurante.');
      return;
    }
    try {
      const reservation = await createReservation({
        customerName: user.name,
        customerPhone: form.customerPhone,
        customerEmail: user.email,
        date: form.date,
        time: form.time,
        partySize: Number(form.partySize),
        notes: form.notes,
        paymentMethod: form.paymentMethod,
      });
      setDone(reservation.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel criar a reserva.');
    }
  };

  const message = `Ola! Gostaria de confirmar minha reserva em ${config.name}. Nome: ${form.customerName || 'cliente'}, data: ${form.date || 'data'}, horario: ${form.time || 'horario'}, pessoas: ${form.partySize}.`;

  return (
    <form onSubmit={submit} className="grid gap-4">
      {!user && (
        <div className="rounded-md border border-gold/25 bg-gold/10 px-4 py-3 text-sm text-ink">
          Para vincular a reserva ao seu perfil, faca <Link className="font-bold text-wine" to="/login">login</Link> ou <Link className="font-bold text-wine" to="/cadastro">crie uma conta</Link>.
        </div>
      )}
      {done && (
        <div className="rounded-md border border-olive/25 bg-olive/10 px-4 py-3 text-sm text-olive">
          <p className="font-bold">Reserva criada com seguranca.</p>
          <p className="mt-1">Status da reserva: {reservationStatusLabel.pending}. Status do pagamento: {paymentStatusLabel[payment?.status || 'unpaid']}.</p>
          {payment?.checkoutUrl && <p className="mt-1">Ambiente de pagamento de teste criado: {payment.providerReference}</p>}
        </div>
      )}
      {error && <div className="rounded-md border border-wine/20 bg-wine/10 px-4 py-3 text-sm font-semibold text-wine">{error}</div>}
      <div className="grid gap-4 md:grid-cols-2">
        <Label label="Nome">
          <Input required value={form.customerName} onChange={(event) => set('customerName', event.target.value)} placeholder="Seu nome" />
        </Label>
        <Label label="Telefone">
          <Input required value={form.customerPhone} onChange={(event) => set('customerPhone', event.target.value)} placeholder="(00) 00000-0000" />
        </Label>
        <Label label="E-mail">
          <Input required type="email" value={form.customerEmail} onChange={(event) => set('customerEmail', event.target.value)} placeholder="voce@email.com" />
        </Label>
        <Label label="Data">
          <Input required type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value, time: '' }))} />
        </Label>
        <Label label="Horario">
          <Select required value={form.time} onChange={(event) => set('time', event.target.value)} disabled={!form.date}>
            <option value="">{form.date ? 'Selecione um horario' : 'Escolha a data primeiro'}</option>
            {slots.map((slot) => {
              const slotAvailability = getSlotAvailability(config, reservations, form.date, slot);
              const disabled = slotAvailability.availableSeats <= 0;
              return (
                <option key={slot} value={slot} disabled={disabled}>
                  {slot} - {disabled ? 'lotado' : `${slotAvailability.availableSeats} lugares disponiveis`}
                </option>
              );
            })}
          </Select>
        </Label>
        <Label label="Pessoas">
          <Select value={form.partySize} onChange={(event) => set('partySize', event.target.value)}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((value) => (
              <option key={value} value={value}>
                {value} {value === 1 ? 'pessoa' : 'pessoas'}
              </option>
            ))}
          </Select>
        </Label>
      </div>
      {availability && (
        <div className="rounded-md bg-linen p-4 text-sm">
          <p className="font-bold text-ink">Disponibilidade para {form.date} as {form.time}</p>
          <p className="mt-1 text-ink/65">Capacidade: {availability.totalCapacity}. Reservados: {availability.reservedSeats}. Disponiveis: {availability.availableSeats} lugares.</p>
        </div>
      )}
      <Label label="Forma de pagamento">
        <Select value={form.paymentMethod} onChange={(event) => set('paymentMethod', event.target.value)}>
          {config.paymentSettings.acceptedMethods.filter((method) => method !== 'pay_at_delivery').map((method) => (
            <option key={method} value={method} disabled={method === 'pay_at_location' && !config.paymentSettings.allowPayAtLocation}>
              {paymentMethodLabel[method]}
            </option>
          ))}
        </Select>
      </Label>
      <div className="grid gap-3 rounded-md border border-black/10 bg-white p-4 text-sm text-ink/70">
        <p className="font-bold text-ink">Resumo antes de confirmar</p>
        <p>{form.partySize} pessoa(s), {form.date || 'data'} as {form.time || 'horario'}.</p>
        <p>Taxa de reserva: <strong>{formatCurrency(reservationFee)}</strong>. Metodo: {paymentMethodLabel[form.paymentMethod]}.</p>
        <p>{describeCancellationPolicy(config.cancellationPolicy)}</p>
        <p className="text-xs">Cartao e Pix usam ambiente externo de pagamento. Nenhum dado sensivel de cartao e coletado ou salvo neste frontend.</p>
      </div>
      <Label label="Observacoes">
        <Textarea value={form.notes} onChange={(event) => set('notes', event.target.value)} placeholder="Preferencia de mesa, ocasiao especial, restricoes..." />
      </Label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" className="flex-1" disabled={!user || !form.time || (availability ? Number(form.partySize) > availability.availableSeats : false)}>
          {form.paymentMethod === 'pix' && <QrCode size={18} />}
          {form.paymentMethod === 'credit_card' && <CreditCard size={18} />}
          {form.paymentMethod === 'debit_card' && <CreditCard size={18} />}
          {form.paymentMethod === 'pay_at_location' && <Landmark size={18} />}
          <CalendarCheck size={18} /> Confirmar reserva
        </Button>
        <ExternalButton href={whatsappUrl(config.whatsapp, message)} target="_blank" rel="noreferrer" variant="secondary" className="flex-1 border-ink/20 bg-ink text-cream">
          <MessageCircle size={18} /> Confirmar no WhatsApp
        </ExternalButton>
      </div>
    </form>
  );
}
