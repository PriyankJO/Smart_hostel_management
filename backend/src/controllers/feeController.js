import Fee from '../models/Fee.js';
import { getPaginationOptions, paginateResults } from '../utils/pagination.js';

export const getFees = async (req, res, next) => {
  try {
    const fees = await Fee.find().populate('studentId', 'name studentId');
    res.json({ success: true, data: fees });
  } catch (error) { next(error); }
};

export const createFee = async (req, res, next) => {
  try {
    const fee = await Fee.create({ ...req.body, receiptId: 'RCPT-' + Date.now().toString().slice(-4), collectedBy: req.user._id });
    res.status(201).json({ success: true, message: 'Fee created', data: fee });
  } catch (error) { next(error); }
};

export const updateFee = async (req, res, next) => {
  try {
    const fee = await Fee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!fee) { res.status(404); throw new Error('Fee not found'); }
    res.json({ success: true, message: 'Fee updated', data: fee });
  } catch (error) { next(error); }
};

export const deleteFee = async (req, res, next) => {
  try {
    await Fee.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Fee deleted' });
  } catch (error) { next(error); }
};

export const getStudentFees = async (req, res, next) => {
  try {
    const fees = await Fee.find({ studentId: req.params.studentId });
    res.json({ success: true, data: fees });
  } catch (error) { next(error); }
};