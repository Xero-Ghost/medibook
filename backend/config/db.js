import mongoose from 'mongoose';
import './env.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';

let connectionPromise;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not configured');
  if (!connectionPromise) {
    connectionPromise = (async () => {
      await mongoose.connect(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: 10000 });
      // Booking and account uniqueness must be enforced before accepting writes.
      await Promise.all([Appointment.init(), User.init(), Doctor.init()]);
      return mongoose.connection;
    })().catch(async (error) => {
      await mongoose.disconnect();
      connectionPromise = undefined;
      throw error;
    });
  }
  return connectionPromise;
}
