import express from 'express';
import { getLeaves, createLeave, updateLeaveStatus } from '../controllers/leaveController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getLeaves)
  .post(protect, createLeave);

router.patch('/:id/status', protect, authorize('admin', 'warden'), updateLeaveStatus);

export default router;