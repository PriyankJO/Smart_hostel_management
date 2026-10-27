import express from 'express';
import { getComplaints, createComplaint, getComplaintById, updateComplaintStatus, deleteComplaint } from '../controllers/complaintController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getComplaints)
  .post(protect, createComplaint);

router.route('/:id')
  .get(protect, getComplaintById)
  .delete(protect, authorize('admin', 'warden'), deleteComplaint);

router.patch('/:id/status', protect, authorize('admin', 'warden'), updateComplaintStatus);

export default router;