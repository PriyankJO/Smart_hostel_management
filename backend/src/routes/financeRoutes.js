import express from 'express';
import {
  getFinanceTransactions,
  createFinanceTransaction,
  updateFinanceTransaction,
  deleteFinanceTransaction
} from '../controllers/financeController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/transactions', protect, getFinanceTransactions);
router.post('/transactions', protect, authorize('admin', 'accountant'), createFinanceTransaction);
router.put('/transactions/:id', protect, authorize('admin', 'accountant'), updateFinanceTransaction);
router.delete('/transactions/:id', protect, authorize('admin', 'accountant'), deleteFinanceTransaction);

export default router;
