import '../config/env.js';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import { validPassword } from '../utils/validation.js';

try {
  const { ADMIN_NAME = 'MediBook Admin', ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ADMIN_EMAIL.trim()) || !validPassword(ADMIN_PASSWORD)) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (8+ characters, at most 72 UTF-8 bytes) before running this command.');
  }
  await connectDB();
  const email = ADMIN_EMAIL.trim().toLowerCase();
  if (await User.exists({ email })) throw new Error('That email already exists. No account or password was changed.');
  await User.create({ name: ADMIN_NAME, email, password: ADMIN_PASSWORD, role: 'admin' });
  console.log('Admin account created. You can now sign in through the website.');
} catch (error) {
  console.error('Admin creation failed:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
