import fs from 'fs';
import path from 'path';

const files = {
  // controllers/complaintController.js
  'src/controllers/complaintController.js': `
import Complaint from '../models/Complaint.js';
import { getPaginationOptions, paginateResults } from '../utils/pagination.js';

export const getComplaints = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req);
    const complaints = await Complaint.find().populate('studentId', 'name studentId').populate('roomId', 'roomNumber').skip(skip).limit(limit).sort({ createdAt: -1 });
    const pagination = await paginateResults(Complaint, {}, page, limit);
    res.json({ success: true, data: complaints, pagination });
  } catch (error) { next(error); }
};

export const createComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.create({ ...req.body, complaintId: 'CMP-' + Date.now().toString().slice(-4) });
    res.status(201).json({ success: true, message: 'Complaint created', data: complaint });
  } catch (error) { next(error); }
};

export const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate('studentId').populate('roomId');
    if (!complaint) { res.status(404); throw new Error('Complaint not found'); }
    res.json({ success: true, data: complaint });
  } catch (error) { next(error); }
};

export const updateComplaintStatus = async (req, res, next) => {
  try {
    const { status, resolution } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id, 
      { status, resolution, resolvedAt: status === 'Resolved' ? Date.now() : undefined }, 
      { new: true }
    );
    if (!complaint) { res.status(404); throw new Error('Complaint not found'); }
    res.json({ success: true, message: 'Complaint updated', data: complaint });
  } catch (error) { next(error); }
};

export const deleteComplaint = async (req, res, next) => {
  try {
    await Complaint.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Complaint deleted' });
  } catch (error) { next(error); }
};
`,
  // routes/complaintRoutes.js
  'src/routes/complaintRoutes.js': `
import express from 'express';
import { getComplaints, createComplaint, getComplaintById, updateComplaintStatus, deleteComplaint } from '../controllers/complaintController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getComplaints)
  .post(protect, createComplaint);

router.route('/:id')
  .get(protect, getComplaintById)
  .delete(protect, authorize('admin', 'warden'), deleteComplaint);

router.patch('/:id/status', protect, authorize('admin', 'warden'), updateComplaintStatus);

export default router;
`,
  // controllers/feeController.js
  'src/controllers/feeController.js': `
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
`,
  // routes/feeRoutes.js
  'src/routes/feeRoutes.js': `
import express from 'express';
import { getFees, createFee, updateFee, deleteFee, getStudentFees } from '../controllers/feeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('admin', 'accountant'), getFees)
  .post(protect, authorize('admin', 'accountant'), createFee);

router.route('/:id')
  .put(protect, authorize('admin', 'accountant'), updateFee)
  .delete(protect, authorize('admin', 'accountant'), deleteFee);

router.get('/student/:studentId', protect, getStudentFees);

export default router;
`
};

Object.entries(files).forEach(([filePath, content]) => {
  fs.writeFileSync(path.join(process.cwd(), filePath), content.trim() + '\\n');
});
console.log('Controllers 3 created.');
