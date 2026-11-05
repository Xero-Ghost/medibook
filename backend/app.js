import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import './config/env.js';
import authRoutes from './routes/authRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import { errorHandler, notFound } from './middleware/errors.js';

const app = express();
const clientOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (clientOrigins.length === 0) throw new Error('CLIENT_URL must contain at least one allowed origin');

app.use(cors({ origin: clientOrigins }));
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  if (req.body === null || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ message: 'Request body must be a JSON object.' });
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.startsWith('replace-this')) {
    return res.status(503).json({ message: 'Server authentication is not configured.' });
  }
  connectDB().then((connection) => {
    req.db = connection;
    next();
  }).catch((error) => {
    error.status = 503;
    next(error);
  });
});
app.get('/api/health', async (req, res, next) => {
  try {
    await req.db.db.command({ ping: 1 });
    res.json({ status: 'ok', service: 'MediBook API' });
  } catch (error) {
    error.status = 503;
    next(error);
  }
});
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contact', contactRoutes);
app.use(notFound);
app.use(errorHandler);
export default app;

