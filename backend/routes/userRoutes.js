import { Router } from 'express';
import { listUsers, updateProfile } from '../controllers/userController.js';
import { allowRoles, protect } from '../middleware/auth.js';

const router = Router();
router.get('/', protect, allowRoles('admin'), listUsers);
router.get('/profile', protect, (req, res) => res.json({ user: req.user }));
router.put('/profile', protect, updateProfile);
export default router;
