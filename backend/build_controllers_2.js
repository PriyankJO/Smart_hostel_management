import fs from 'fs';
import path from 'path';

const files = {
  // controllers/roomController.js
  'src/controllers/roomController.js': `
import Room from '../models/Room.js';
import RoomHistory from '../models/RoomHistory.js';
import { getPaginationOptions, paginateResults } from '../utils/pagination.js';

export const getRooms = async (req, res, next) => {
  try {
    const search = req.query.search;
    let query = {};
    if (search) { query = { roomNumber: { $regex: search, $options: 'i' } }; }
    
    const rooms = await Room.find(query).populate('students');
    res.json({ success: true, data: rooms });
  } catch (error) { next(error); }
};

export const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id).populate('students');
    if (!room) { res.status(404); throw new Error('Room not found'); }
    res.json({ success: true, data: room });
  } catch (error) { next(error); }
};

export const createRoom = async (req, res, next) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json({ success: true, message: 'Room created', data: room });
  } catch (error) { next(error); }
};

export const updateRoom = async (req, res, next) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!room) { res.status(404); throw new Error('Room not found'); }
    res.json({ success: true, message: 'Room updated', data: room });
  } catch (error) { next(error); }
};

export const deleteRoom = async (req, res, next) => {
  try {
    await Room.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Room deleted' });
  } catch (error) { next(error); }
};
`,
  // routes/roomRoutes.js
  'src/routes/roomRoutes.js': `
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
`,
  // controllers/leaveController.js
  'src/controllers/leaveController.js': `
import Leave from '../models/Leave.js';
import { getPaginationOptions, paginateResults } from '../utils/pagination.js';

export const getLeaves = async (req, res, next) => {
  try {
    const leaves = await Leave.find().populate('studentId').populate('approvedBy', 'name');
    res.json({ success: true, data: leaves });
  } catch (error) { next(error); }
};

export const createLeave = async (req, res, next) => {
  try {
    const leave = await Leave.create({ ...req.body, leaveId: 'LR-' + Date.now().toString().slice(-4) });
    res.status(201).json({ success: true, message: 'Leave created', data: leave });
  } catch (error) { next(error); }
};

export const updateLeaveStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const leave = await Leave.findByIdAndUpdate(
      req.params.id, 
      { status, approvedBy: req.user._id, approvedAt: Date.now() }, 
      { new: true }
    );
    if (!leave) { res.status(404); throw new Error('Leave not found'); }
    res.json({ success: true, message: 'Leave updated', data: leave });
  } catch (error) { next(error); }
};
`,
  // routes/leaveRoutes.js
  'src/routes/leaveRoutes.js': `
import express from 'express';
import { getLeaves, createLeave, updateLeaveStatus } from '../controllers/leaveController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getLeaves)
  .post(protect, createLeave);

router.patch('/:id/status', protect, authorize('admin', 'warden'), updateLeaveStatus);

export default router;
`
};

Object.entries(files).forEach(([filePath, content]) => {
  fs.writeFileSync(path.join(process.cwd(), filePath), content.trim() + '\\n');
});
console.log('Controllers 2 created.');
