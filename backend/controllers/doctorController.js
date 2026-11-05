import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import { availableSlots } from '../utils/slots.js';
import { isValidAvailability, validPassword } from '../utils/validation.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function listDoctors(req, res, next) {
  try {
    const { search, specialization, sort } = req.query;
    if ([search, specialization, sort].some((value) => value !== undefined && typeof value !== 'string')) {
      return res.status(400).json({ message: 'Search, specialization, and sort must be text.' });
    }
    const query = { isActive: { $ne: false } };
    if (specialization && specialization !== 'All specialties') query.specialization = specialization;
    if (search) {
      const safeSearch = escapeRegex(String(search));
      const users = await User.find({ name: { $regex: safeSearch, $options: 'i' }, role: 'doctor' }).select('_id');
      query.$or = [
        { userId: { $in: users.map((user) => user._id) } },
        { specialization: { $regex: safeSearch, $options: 'i' } }
      ];
    }
    let doctors = Doctor.find(query).populate('userId', 'name profileImage');
    if (sort === 'fee-asc') doctors = doctors.sort({ consultationFee: 1 });
    if (sort === 'fee-desc') doctors = doctors.sort({ consultationFee: -1 });
    res.json({ doctors: await doctors });
  } catch (error) {
    next(error);
  }
}

export async function getDoctor(req, res, next) {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('userId', 'name profileImage');
    if (!doctor || doctor.isActive === false) return res.status(404).json({ message: 'Doctor not found.' });
    res.json({ doctor });
  } catch (error) {
    next(error);
  }
}

export async function getSlots(req, res, next) {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor || doctor.isActive === false) return res.status(404).json({ message: 'Doctor not found.' });
    const slots = await availableSlots(doctor, req.query.date);
    if (slots === null) return res.status(400).json({ message: 'Date must use YYYY-MM-DD format.' });
    res.json({ slots });
  } catch (error) {
    next(error);
  }
}

export async function createDoctor(req, res, next) {
  try {
    const { name, email, password, specialization, qualification, experience, consultationFee, about, phone } = req.body;
    if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !email.trim() ||
        typeof password !== 'string' || typeof specialization !== 'string' || !specialization.trim() ||
        typeof qualification !== 'string' || !qualification.trim()) {
      return res.status(400).json({ message: 'Name, email, password, specialization, and qualification are required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (!validPassword(password)) return res.status(400).json({ message: 'Password must be at least 8 characters and at most 72 UTF-8 bytes.' });
    if (phone !== undefined && (typeof phone !== 'string' || phone.length > 30)) return res.status(400).json({ message: 'Phone must be text with at most 30 characters.' });
    if (about !== undefined && (typeof about !== 'string' || about.length > 1200)) {
      return res.status(400).json({ message: 'Doctor bio must be text with 1,200 characters or fewer.' });
    }
    const years = experience === undefined || experience === '' ? 0 : Number(experience);
    const fee = consultationFee === undefined || consultationFee === null || consultationFee === '' ? NaN : Number(consultationFee);
    if (!Number.isFinite(years) || years < 0 || !Number.isFinite(fee) || fee < 0) {
      return res.status(400).json({ message: 'Experience and consultation fee must be non-negative numbers.' });
    }
    const user = await User.create({ name, email, password, phone, role: 'doctor' });
    let doctor;
    try {
      doctor = await Doctor.create({
        userId: user._id,
        specialization,
        qualification,
        experience: years,
        consultationFee: fee,
        about
      });
    } catch (error) {
      await User.findByIdAndDelete(user._id);
      throw error;
    }
    res.status(201).json({ doctor: await doctor.populate('userId', 'name email phone profileImage') });
  } catch (error) {
    next(error);
  }
}

export async function updateDoctor(req, res, next) {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' });
    if (req.user.role === 'doctor' && String(doctor.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only update your own doctor profile.' });
    }
    const fields = ['specialization', 'qualification', 'experience', 'consultationFee', 'about', 'availability'];
    for (const field of fields) {
      if (req.body[field] !== undefined) doctor[field] = req.body[field];
    }
    if (req.body.availability !== undefined && !isValidAvailability(req.body.availability)) {
      return res.status(400).json({ message: 'Availability must include valid weekdays, working hours, and a 15–120 minute slot length.' });
    }
    await doctor.save();
    res.json({ doctor: await doctor.populate('userId', 'name email phone profileImage') });
  } catch (error) {
    next(error);
  }
}

export async function updateMyDoctorProfile(req, res, next) {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found.' });
    const { availability, about } = req.body;
    if (availability !== undefined) {
      if (!isValidAvailability(availability)) {
        return res.status(400).json({ message: 'Availability must include valid weekdays, working hours, and a 15–120 minute slot length.' });
      }
      doctor.availability = availability;
    }
    if (about !== undefined) doctor.about = about;
    await doctor.save();
    res.json({ doctor: await doctor.populate('userId', 'name email phone profileImage') });
  } catch (error) {
    next(error);
  }
}

export async function deleteDoctor(req, res, next) {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' });
    const active = await Appointment.exists({ doctorId: doctor._id, status: { $in: ['pending', 'confirmed'] } });
    if (active) return res.status(409).json({ message: 'Cancel or complete this doctor’s active appointments before removing the doctor.' });
    // Keep references for completed/cancelled appointment history.
    doctor.isActive = false;
    await doctor.save();
    await User.findByIdAndUpdate(doctor.userId, { isActive: false });
    res.json({ message: 'Doctor removed.' });
  } catch (error) {
    next(error);
  }
}
