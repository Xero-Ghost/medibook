import Appointment from '../models/Appointment.js';
import { clinicNow } from '../../shared/clinicTime.js';
import { isValidAvailability } from './validation.js';

export function makeSlots(availability) {
  if (!isValidAvailability(availability)) return [];
  const toMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  const slots = [];
  for (let minute = toMinutes(availability.startTime); minute + availability.slotDuration <= toMinutes(availability.endTime); minute += availability.slotDuration) {
    slots.push(`${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`);
  }
  return slots;
}

export function parseAppointmentDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

export async function availableSlots(doctor, dateValue) {
  const date = parseAppointmentDate(dateValue);
  if (!date) return null;
  const now = clinicNow();
  if (!isValidAvailability(doctor.availability) || !doctor.availability.days.includes(date.getUTCDay()) || dateValue < now.date) return [];
  const allSlots = makeSlots(doctor.availability);
  const booked = await Appointment.find({
    doctorId: doctor._id,
    appointmentDate: date,
    status: { $in: ['pending', 'confirmed'] }
  }).select('timeSlot');
  const reserved = new Set(booked.map((appointment) => appointment.timeSlot));
  return allSlots.filter((slot) => !reserved.has(slot) && (dateValue !== now.date || slot > now.time));
}
