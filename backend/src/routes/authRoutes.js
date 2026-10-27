import express from 'express';
import {
  authStaff,
  authStudent,
  getUserProfile,
  logoutUser,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/staff/login', authStaff);
router.post('/student/login', authStudent);
router.post('/logout', logoutUser);
router.get('/me', protect, getUserProfile);

export default router;
