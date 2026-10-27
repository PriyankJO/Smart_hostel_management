import express from 'express';
import {
  getWeeklyMenu,
  getTodayMenu,
  updateDayMenu
} from '../controllers/messController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getWeeklyMenu);
router.get('/today', getTodayMenu);
router.put('/:day', protect, authorize('admin', 'canteen_manager', 'warden'), updateDayMenu);

export default router;
