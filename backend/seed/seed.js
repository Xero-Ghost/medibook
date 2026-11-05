import '../config/env.js';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';

const accounts = [
  { name: 'MediBook Admin', email: 'admin@medibook.demo', password: 'Admin123!', role: 'admin', phone: '555-0100' },
  { name: 'Olivia Bennett', email: 'patient@medibook.demo', password: 'Patient123!', role: 'patient', phone: '555-0101' },
  { name: 'Dr. Amelia Carter', email: 'doctor@medibook.demo', password: 'Doctor123!', role: 'doctor', phone: '555-0201', specialization: 'Cardiology', qualification: 'MD, FACC', experience: 12, consultationFee: 120, about: 'Dr. Carter is committed to helping patients build healthier hearts through thoughtful, evidence-based care.' },
  { name: 'Dr. Noah Williams', email: 'noah@medibook.demo', password: 'Doctor123!', role: 'doctor', phone: '555-0202', specialization: 'Dermatology', qualification: 'MD, FAAD', experience: 9, consultationFee: 95, about: 'Dr. Williams offers compassionate care for skin health, from routine checkups to personalized treatment plans.' },
  { name: 'Dr. Sophia Patel', email: 'sophia@medibook.demo', password: 'Doctor123!', role: 'doctor', phone: '555-0203', specialization: 'Neurology', qualification: 'MD, PhD', experience: 15, consultationFee: 150, about: 'Dr. Patel combines clinical expertise and attentive listening to support every patient’s neurological health.' },
  { name: 'Dr. Ethan Brooks', email: 'ethan@medibook.demo', password: 'Doctor123!', role: 'doctor', phone: '555-0204', specialization: 'Pediatrics', qualification: 'MD, FAAP', experience: 8, consultationFee: 85, about: 'Dr. Brooks partners with families to give children a healthy, confident start at every age.' },
  { name: 'Dr. Grace Kim', email: 'grace@medibook.demo', password: 'Doctor123!', role: 'doctor', phone: '555-0205', specialization: 'Orthopedics', qualification: 'MD, FAAOS', experience: 11, consultationFee: 110, about: 'Dr. Kim helps patients get back to the activities they love with practical, personalized orthopedic care.' },
  { name: 'Dr. Lucas Morgan', email: 'lucas@medibook.demo', password: 'Doctor123!', role: 'doctor', phone: '555-0206', specialization: 'General Practice', qualification: 'MD', experience: 10, consultationFee: 75, about: 'Dr. Morgan provides welcoming primary care focused on prevention, wellness, and long-term health.' }
];

try {
  if (process.env.NODE_ENV === 'production') throw new Error('Demo seeding is disabled in production. Use create-admin instead.');
  await connectDB();
  for (const account of accounts) {
    const { specialization, qualification, experience, consultationFee, about, ...userData } = account;
    let user = await User.findOne({ email: userData.email });
    if (!user) user = await User.create(userData);
    if (specialization) {
      await Doctor.findOneAndUpdate(
        { userId: user._id },
        {
          $setOnInsert: {
            specialization,
            qualification,
            experience,
            consultationFee,
            about,
            availability: { days: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '17:00', slotDuration: 30 }
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
  }
  console.log('Demo accounts and doctors are ready.');
} catch (error) {
  console.error('Seed failed:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
