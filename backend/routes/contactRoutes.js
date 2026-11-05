import { Router } from 'express';
import { createContactMessage, listContactMessages } from '../controllers/contactController.js';
import { allowRoles, protect } from '../middleware/auth.js';

const router = Router();
router.post('/', createContactMessage);
router.get('/', protect, allowRoles('admin'), listContactMessages);
export default router;
