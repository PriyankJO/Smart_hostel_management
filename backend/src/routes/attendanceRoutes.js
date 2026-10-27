import express from 'express';
import {
  getAttendance,
  saveAttendance,
  updateSingleAttendance,
  getRollCallSheet,
  getMonthWiseAttendanceReport,
  getYearWiseAttendanceReport,
  getAttendanceAnalysis
} from '../controllers/attendanceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getAttendance)
  .post(protect, authorize('admin', 'warden', 'staff'), saveAttendance);

router.get('/rollcall-sheet', protect, getRollCallSheet);
router.get('/month-wise', protect, getMonthWiseAttendanceReport);
router.get('/year-wise', protect, getYearWiseAttendanceReport);
router.get('/analysis', protect, getAttendanceAnalysis);

router.route('/:id')
  .put(protect, authorize('admin', 'warden', 'staff'), updateSingleAttendance);

export default router;
