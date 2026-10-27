import express from 'express';
import { getFees, createFee, updateFee, deleteFee, getStudentFees } from '../controllers/feeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('admin', 'accountant'), getFees)
  .post(protect, authorize('admin', 'accountant'), createFee);

router.route('/:id')
  .put(protect, authorize('admin', 'accountant'), updateFee)
  .delete(protect, authorize('admin', 'accountant'), deleteFee);

router.get('/student/:studentId', protect, getStudentFees);

export default router;