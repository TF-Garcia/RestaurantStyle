import type { OpeningHour, Reservation, RestaurantConfig } from '../types';

const minutes = (time: string) => {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
};

const toTime = (value: number) => {
  const normalized = ((value % 1440) + 1440) % 1440;
  const hour = Math.floor(normalized / 60).toString().padStart(2, '0');
  const minute = (normalized % 60).toString().padStart(2, '0');
  return `${hour}:${minute}`;
};

export const getDayOpeningHour = (date: string, openingHours: OpeningHour[]) => {
  if (!date) return undefined;
  const day = new Date(`${date}T00:00:00`).getDay();
  return openingHours.find((openingHour) => openingHour.dayOfWeek === day);
};

const isBetween = (time: string, start: string, end: string) => {
  const value = minutes(time);
  const startValue = minutes(start);
  const endValue = minutes(end);
  return endValue <= startValue ? value >= startValue || value <= endValue : value >= startValue && value <= endValue;
};

export const getReservationSlots = (config: RestaurantConfig, date: string) => {
  const openingHour = getDayOpeningHour(date, config.openingHours);
  if (!openingHour || !openingHour.isOpen) return [];

  const latestStart = toTime(minutes(openingHour.closeTime) - config.reservationSettings.averageDurationMinutes);

  return openingHour.reservationIntervals.flatMap((interval) => {
    const slots: string[] = [];
    let current = minutes(interval.startTime);
    const end = Math.min(minutes(interval.endTime), minutes(latestStart));

    while (current <= end) {
      const slot = toTime(current);
      if (!openingHour.blockedSlots.includes(slot) && isBetween(slot, openingHour.openTime, latestStart)) {
        slots.push(slot);
      }
      current += config.reservationSettings.slotStepMinutes;
    }

    return slots;
  });
};

export const getSlotAvailability = (config: RestaurantConfig, reservations: Reservation[], date: string, time: string) => {
  const openingHour = getDayOpeningHour(date, config.openingHours);
  const totalCapacity = openingHour?.capacityPerSlot || config.reservationSettings.defaultCapacityPerSlot;
  const reservedSeats = reservations
    .filter((reservation) => reservation.date === date && reservation.time === time && !['cancelled', 'no_show'].includes(reservation.status))
    .reduce((sum, reservation) => sum + reservation.partySize, 0);

  return {
    totalCapacity,
    reservedSeats,
    availableSeats: Math.max(totalCapacity - reservedSeats, 0),
  };
};

export const validateReservationAvailability = (
  config: RestaurantConfig,
  reservations: Reservation[],
  date: string,
  time: string,
  partySize: number,
) => {
  const slots = getReservationSlots(config, date);
  if (!slots.includes(time)) return { valid: false, message: 'Horario indisponivel para reservas.' };
  const availability = getSlotAvailability(config, reservations, date, time);
  if (partySize > availability.availableSeats) return { valid: false, message: 'Quantidade de pessoas maior que os lugares disponiveis.' };
  return { valid: true, message: 'Horario disponivel.', availability };
};
