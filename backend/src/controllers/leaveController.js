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