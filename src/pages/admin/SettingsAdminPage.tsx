import { useState, type FormEvent } from 'react';
import { Save } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Label, Select, Textarea } from '../../components/ui/Form';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import { getReservationSlots, getSlotAvailability } from '../../services/availabilityService';
import type { OpeningHour } from '../../types';

const weekDays = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];

export function SettingsAdminPage() {
  const { config, updateConfig, reservations } = useRestaurantData();
  const [form, setForm] = useState(config);
  const [saved, setSaved] = useState(false);
  const [availabilityDate, setAvailabilityDate] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    updateConfig({
      ...form,
      reservationCapacity: Number(form.reservationCapacity),
      reservationSettings: {
        ...form.reservationSettings,
        defaultCapacityPerSlot: Number(form.reservationSettings.defaultCapacityPerSlot),
        averageDurationMinutes: Number(form.reservationSettings.averageDurationMinutes),
        slotStepMinutes: Number(form.reservationSettings.slotStepMinutes),
      },
      paymentSettings: {
        ...form.paymentSettings,
        reservationFee: Number(form.paymentSettings.reservationFee),
        unpaidExpirationMinutes: Number(form.paymentSettings.unpaidExpirationMinutes),
      },
      cancellationPolicy: {
        ...form.cancellationPolicy,
        fullRefundHoursBefore: Number(form.cancellationPolicy.fullRefundHoursBefore),
        partialRefundHoursBefore: Number(form.cancellationPolicy.partialRefundHoursBefore),
        lateRetentionPercentage: Number(form.cancellationPolicy.lateRetentionPercentage),
        noShowRetentionPercentage: Number(form.cancellationPolicy.noShowRetentionPercentage),
      },
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  const updateOpeningHour = (index: number, patch: Partial<OpeningHour>) => {
    const openingHours = form.openingHours.map((item, currentIndex) => (currentIndex === index ? { ...item, ...patch } : item));
    setForm({ ...form, openingHours });
  };

  const updateIntervalText = (index: number, value: string) => {
    const reservationIntervals = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [startTime, endTime] = item.split('-').map((part) => part.trim());
        return { startTime, endTime };
      });
    updateOpeningHour(index, { reservationIntervals });
  };

  const updateBlockedSlots = (index: number, value: string) => {
    updateOpeningHour(index, { blockedSlots: value.split(',').map((item) => item.trim()).filter(Boolean) });
  };

  const reservationsForDate = reservations.filter((reservation) => reservation.date === availabilityDate);
  const slotsForDate = availabilityDate ? getReservationSlots(form, availabilityDate) : [];

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-wine">Configuracoes</p>
      <h1 className="mt-2 font-display text-4xl font-bold">Dados, horarios e politicas</h1>
      <form onSubmit={submit} className="mt-7 grid gap-7">
        {saved && <p className="rounded-md bg-olive/10 px-4 py-3 text-sm font-semibold text-olive">Configuracoes salvas.</p>}

        <Card className="p-5 md:p-7">
          <h2 className="font-display text-3xl font-bold">Restaurante</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Label label="Nome"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Label>
            <Label label="Slogan"><Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} /></Label>
            <Label label="WhatsApp"><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></Label>
            <Label label="Instagram"><Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} /></Label>
            <Label label="Endereco"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Label>
            <Label label="Capacidade geral"><Input type="number" value={form.reservationCapacity} onChange={(e) => setForm({ ...form, reservationCapacity: Number(e.target.value) })} /></Label>
            <Label label="Imagem hero"><Input value={form.heroImage} onChange={(e) => setForm({ ...form, heroImage: e.target.value })} /></Label>
            <Label label="Imagem sobre"><Input value={form.aboutImage} onChange={(e) => setForm({ ...form, aboutImage: e.target.value })} /></Label>
          </div>
          <div className="mt-4 grid gap-4">
            <Label label="Horarios em texto"><Textarea value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} /></Label>
            <Label label="Texto institucional"><Textarea value={form.institutionalText} onChange={(e) => setForm({ ...form, institutionalText: e.target.value })} /></Label>
          </div>
        </Card>

        <Card className="p-5 md:p-7">
          <h2 className="font-display text-3xl font-bold">Horarios de funcionamento e reservas</h2>
          <div className="mt-5 grid gap-4">
            {form.openingHours.map((openingHour, index) => (
              <div key={openingHour.dayOfWeek} className="grid gap-3 rounded-md border border-black/10 bg-white p-4 lg:grid-cols-[120px_90px_1fr_1fr_1fr_1fr] lg:items-end">
                <p className="font-semibold">{weekDays[openingHour.dayOfWeek]}</p>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={openingHour.isOpen} onChange={(e) => updateOpeningHour(index, { isOpen: e.target.checked })} /> Aberto</label>
                <Label label="Abertura"><Input type="time" value={openingHour.openTime} onChange={(e) => updateOpeningHour(index, { openTime: e.target.value })} /></Label>
                <Label label="Fechamento"><Input type="time" value={openingHour.closeTime} onChange={(e) => updateOpeningHour(index, { closeTime: e.target.value })} /></Label>
                <Label label="Capacidade por horario"><Input type="number" value={openingHour.capacityPerSlot} onChange={(e) => updateOpeningHour(index, { capacityPerSlot: Number(e.target.value) })} /></Label>
                <Label label="Bloqueios"><Input value={openingHour.blockedSlots.join(', ')} onChange={(e) => updateBlockedSlots(index, e.target.value)} placeholder="20:00, 21:00" /></Label>
                <div className="lg:col-span-6">
                  <Label label="Intervalos de reserva">
                    <Input value={openingHour.reservationIntervals.map((item) => `${item.startTime}-${item.endTime}`).join(', ')} onChange={(e) => updateIntervalText(index, e.target.value)} placeholder="12:00-15:00, 18:30-21:30" />
                  </Label>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 md:p-7">
          <h2 className="font-display text-3xl font-bold">Reservas e pagamento</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Label label="Duracao media (min)"><Input type="number" value={form.reservationSettings.averageDurationMinutes} onChange={(e) => setForm({ ...form, reservationSettings: { ...form.reservationSettings, averageDurationMinutes: Number(e.target.value) } })} /></Label>
            <Label label="Intervalo dos slots (min)"><Input type="number" value={form.reservationSettings.slotStepMinutes} onChange={(e) => setForm({ ...form, reservationSettings: { ...form.reservationSettings, slotStepMinutes: Number(e.target.value) } })} /></Label>
            <Label label="Taxa por pessoa"><Input type="number" value={form.paymentSettings.reservationFee} onChange={(e) => setForm({ ...form, paymentSettings: { ...form.paymentSettings, reservationFee: Number(e.target.value) } })} /></Label>
            <Label label="Expiracao sem pagamento (min)"><Input type="number" value={form.paymentSettings.unpaidExpirationMinutes} onChange={(e) => setForm({ ...form, paymentSettings: { ...form.paymentSettings, unpaidExpirationMinutes: Number(e.target.value) } })} /></Label>
            <Label label="Pagamento no local">
              <Select value={String(form.paymentSettings.allowPayAtLocation)} onChange={(e) => setForm({ ...form, paymentSettings: { ...form.paymentSettings, allowPayAtLocation: e.target.value === 'true' } })}>
                <option value="true">Aceitar</option>
                <option value="false">Nao aceitar</option>
              </Select>
            </Label>
            <Label label="Auto confirmar local">
              <Select value={String(form.reservationSettings.autoConfirmPayAtLocation)} onChange={(e) => setForm({ ...form, reservationSettings: { ...form.reservationSettings, autoConfirmPayAtLocation: e.target.value === 'true' } })}>
                <option value="false">Manter pendente</option>
                <option value="true">Confirmar sem pagamento</option>
              </Select>
            </Label>
          </div>
        </Card>

        <Card className="p-5 md:p-7">
          <h2 className="font-display text-3xl font-bold">Politica de cancelamento e estorno</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <Label label="Estorno total ate (h)"><Input type="number" value={form.cancellationPolicy.fullRefundHoursBefore} onChange={(e) => setForm({ ...form, cancellationPolicy: { ...form.cancellationPolicy, fullRefundHoursBefore: Number(e.target.value) } })} /></Label>
            <Label label="Estorno parcial ate (h)"><Input type="number" value={form.cancellationPolicy.partialRefundHoursBefore} onChange={(e) => setForm({ ...form, cancellationPolicy: { ...form.cancellationPolicy, partialRefundHoursBefore: Number(e.target.value) } })} /></Label>
            <Label label="Retencao tardia (%)"><Input type="number" value={form.cancellationPolicy.lateRetentionPercentage} onChange={(e) => setForm({ ...form, cancellationPolicy: { ...form.cancellationPolicy, lateRetentionPercentage: Number(e.target.value) } })} /></Label>
            <Label label="Retencao no-show (%)"><Input type="number" value={form.cancellationPolicy.noShowRetentionPercentage} onChange={(e) => setForm({ ...form, cancellationPolicy: { ...form.cancellationPolicy, noShowRetentionPercentage: Number(e.target.value) } })} /></Label>
          </div>
        </Card>

        <Card className="p-5 md:p-7">
          <h2 className="font-display text-3xl font-bold">Reservas por data e horario</h2>
          <div className="mt-5 max-w-xs"><Label label="Data"><Input type="date" value={availabilityDate} onChange={(e) => setAvailabilityDate(e.target.value)} /></Label></div>
          <div className="mt-5 grid gap-3">
            {slotsForDate.map((slot) => {
              const availability = getSlotAvailability(form, reservations, availabilityDate, slot);
              const reservationsAtSlot = reservationsForDate.filter((reservation) => reservation.time === slot);
              return (
                <div key={slot} className="rounded-md bg-linen p-3 text-sm">
                  <p className="font-bold">{slot} · {availability.totalCapacity} total · {availability.reservedSeats} reservados · {availability.availableSeats} disponiveis</p>
                  {reservationsAtSlot.map((reservation) => (
                    <p key={reservation.id} className="mt-1 text-ink/65">{reservation.customerName} · {reservation.partySize} lugares · {reservation.status} · {reservation.paymentStatus}</p>
                  ))}
                </div>
              );
            })}
            {availabilityDate && reservationsForDate.length === 0 && <p className="text-sm text-ink/55">Nenhuma reserva para esta data.</p>}
          </div>
        </Card>

        <Button type="submit" className="w-full sm:w-auto"><Save size={18} /> Salvar configuracoes</Button>
      </form>
    </div>
  );
}
