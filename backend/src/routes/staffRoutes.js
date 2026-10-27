import express from 'express';
import { getStaff, getStaffById, createStaff } from '../controllers/staffController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('admin', 'warden'), getStaff)
  .post(protect, authorize('admin'), createStaff);

router.route('/:id').get(protect, getStaffById);

export default router;