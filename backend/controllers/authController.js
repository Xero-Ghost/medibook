import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { validPassword } from '../utils/validation.js';

function createToken(userId) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export async function register(req, res, next) {
  try {
    const { name, email, password, phone } = req.body;
    if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !email.trim() || typeof password !== 'string') {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (!validPassword(password)) return res.status(400).json({ message: 'Password must be at least 8 characters and at most 72 UTF-8 bytes.' });
    if (phone !== undefined && (typeof phone !== 'string' || phone.length > 30)) return res.status(400).json({ message: 'Phone must be text with at most 30 characters.' });
    const user = await User.create({ name, email, password, phone, role: 'patient' });
    res.status(201).json({ token: createToken(user._id), user });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim()) return res.status(400).json({ message: 'Email and password are required.' });
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!validPassword(password) || !user || user.isActive === false || !(await user.comparePassword(password))) return res.status(401).json({ message: 'Email or password is incorrect.' });
    res.json({ token: createToken(user._id), user });
  } catch (error) {
    next(error);
  }
}

export function me(req, res) {
  res.json({ user: req.user });
}
