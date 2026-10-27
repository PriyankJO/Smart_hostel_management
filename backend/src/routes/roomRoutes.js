import express from 'express';
import { getRooms, getRoomById, createRoom, updateRoom, deleteRoom } from '../controllers/roomController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getRooms)
  .post(protect, authorize('admin', 'warden'), createRoom);

router.route('/:id')
  .get(protect, getRoomById)
  .put(protect, authorize('admin', 'warden'), updateRoom)
  .delete(protect, authorize('admin'), deleteRoom);

export default router;