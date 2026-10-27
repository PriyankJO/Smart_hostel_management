import express from 'express';
import {
  getCanteenItems,
  createCanteenItem,
  updateCanteenItem,
  deleteCanteenItem,
  getCanteenTransactions,
  createCanteenTransaction,
  deleteCanteenTransaction
} from '../controllers/canteenController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Items endpoints
router.get('/items', getCanteenItems);
router.post('/items', protect, authorize('admin', 'canteen_manager', 'warden'), createCanteenItem);
router.put('/items/:id', protect, authorize('admin', 'canteen_manager', 'warden'), updateCanteenItem);
router.delete('/items/:id', protect, authorize('admin', 'canteen_manager', 'warden'), deleteCanteenItem);

// Transactions endpoints
router.get('/transactions', protect, getCanteenTransactions);
router.post('/transactions', protect, authorize('admin', 'canteen_manager', 'accountant', 'warden'), createCanteenTransaction);
router.delete('/transactions/:id', protect, authorize('admin', 'canteen_manager', 'warden'), deleteCanteenTransaction);

export default router;
