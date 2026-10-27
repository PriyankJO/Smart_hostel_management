import express from 'express';
import { getVisitors, createVisitor } from '../controllers/visitorController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('admin', 'warden', 'staff'), getVisitors)
  .post(protect, authorize('admin', 'warden', 'staff'), createVisitor);

export default router;