import express from 'express';
import { getNotices } from '../controllers/noticeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.route('/').get(protect, getNotices);
export default router;