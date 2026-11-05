import { Router } from 'express';
import { allAppointments, createAppointment, deleteAppointment, doctorAppointments, myAppointments, updateAppointmentStatus } from '../controllers/appointmentController.js';
import { allowRoles, protect } from '../middleware/auth.js';

const router = Router();
router.post('/', protect, allowRoles('patient'), createAppointment);
router.get('/my', protect, allowRoles('patient'), myAppointments);
router.get('/doctor', protect, allowRoles('doctor'), doctorAppointments);
router.get('/', protect, allowRoles('admin'), allAppointments);
router.put('/:id/status', protect, updateAppointmentStatus);
router.delete('/:id', protect, deleteAppointment);
export default router;
