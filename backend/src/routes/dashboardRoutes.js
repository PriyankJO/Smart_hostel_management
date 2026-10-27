import express from 'express';
import { getAdminDashboard } from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/admin', protect, getAdminDashboard);
// Add other dashboards here...

export default router;