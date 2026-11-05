import { Router } from 'express';
import { createDoctor, deleteDoctor, getDoctor, getSlots, listDoctors, updateDoctor, updateMyDoctorProfile } from '../controllers/doctorController.js';
import { allowRoles, protect } from '../middleware/auth.js';

const router = Router();
router.get('/', listDoctors);
router.get('/:id/slots', getSlots);
router.get('/:id', getDoctor);
router.post('/', protect, allowRoles('admin'), createDoctor);
router.put('/me/profile', protect, allowRoles('doctor'), updateMyDoctorProfile);
router.put('/:id', protect, allowRoles('doctor', 'admin'), updateDoctor);
router.delete('/:id', protect, allowRoles('admin'), deleteDoctor);
export default router;
