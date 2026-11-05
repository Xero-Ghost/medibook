import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import { isObjectIdOrHexString } from 'mongoose';
import { availableSlots, parseAppointmentDate } from '../utils/slots.js';

const appointmentPopulation = [
  { path: 'patientId', select: 'name email phone profileImage' },
  { path: 'doctorId', populate: { path: 'userId', select: 'name email phone profileImage' } }
];

export async function createAppointment(req, res, next) {
  try {
    const { doctorId, appointmentDate: dateValue, timeSlot, reason } = req.body;
    const date = parseAppointmentDate(dateValue);
    if (!isObjectIdOrHexString(doctorId) || !date || typeof timeSlot !== 'string' || !timeSlot) return res.status(400).json({ message: 'Doctor, a valid appointment date, and a time slot are required.' });
    if (reason !== undefined && (typeof reason !== 'string' || reason.length > 500)) {
      return res.status(400).json({ message: 'Reason must be text with 500 characters or fewer.' });
    }
    const doctor = await Doctor.findById(doctorId);
    if (!doctor || doctor.isActive === false) return res.status(404).json({ message: 'Doctor not found.' });
    const slots = await availableSlots(doctor, dateValue);
    if (!slots?.includes(timeSlot)) return res.status(409).json({ message: 'That slot is no longer available. Please choose another time.' });
    const appointment = await Appointment.create({ patientId: req.user._id, doctorId, appointmentDate: date, timeSlot, reason });
    res.status(201).json({ appointment: await appointment.populate(appointmentPopulation) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'That appointment slot has already been booked.' });
    next(error);
  }
}

export async function myAppointments(req, res, next) {
  try {
    const appointments = await Appointment.find({ patientId: req.user._id }).populate(appointmentPopulation).sort({ appointmentDate: -1, timeSlot: -1 });
    res.json({ appointments });
  } catch (error) {
    next(error);
  }
}

export async function doctorAppointments(req, res, next) {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found.' });
    const appointments = await Appointment.find({ doctorId: doctor._id }).populate(appointmentPopulation).sort({ appointmentDate: 1, timeSlot: 1 });
    res.json({ appointments });
  } catch (error) {
    next(error);
  }
}

export async function allAppointments(_req, res, next) {
  try {
    const appointments = await Appointment.find().populate(appointmentPopulation).sort({ appointmentDate: -1 });
    res.json({ appointments });
  } catch (error) {
    next(error);
  }
}

export async function updateAppointmentStatus(req, res, next) {
  try {
    const { status } = req.body;
    const allowed = ['confirmed', 'cancelled', 'completed'];
    if (!allowed.includes(status)) return res.status(400).json({ message: `Status must be one of: ${allowed.join(', ')}.` });
    const appointment = await Appointment.findById(req.params.id).populate('doctorId');
    if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });
    const isDoctor = req.user.role === 'doctor' && String(appointment.doctorId?.userId) === String(req.user._id);
    const isPatientCancel = req.user.role === 'patient' && String(appointment.patientId) === String(req.user._id) && status === 'cancelled';
    const isAdmin = req.user.role === 'admin';
    if (!isDoctor && !isPatientCancel && !isAdmin) return res.status(403).json({ message: 'You cannot update this appointment.' });
    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
      return res.status(409).json({ message: 'This appointment can no longer be changed.' });
    }
    if (status === 'completed' && appointment.status !== 'confirmed') {
      return res.status(409).json({ message: 'Only confirmed appointments can be completed.' });
    }
    const updated = await Appointment.findOneAndUpdate(
      { _id: appointment._id, status: appointment.status },
      { $set: { status } },
      { new: true, runValidators: true }
    ).populate(appointmentPopulation);
    if (!updated) return res.status(409).json({ message: 'Appointment changed. Refresh and try again.' });
    res.json({ appointment: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteAppointment(req, res, next) {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });
    if (req.user.role !== 'admin' && String(appointment.patientId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You cannot remove this appointment.' });
    }
    await appointment.deleteOne();
    res.json({ message: 'Appointment removed.' });
  } catch (error) {
    next(error);
  }
}
