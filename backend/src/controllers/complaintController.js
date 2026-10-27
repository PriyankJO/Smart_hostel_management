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