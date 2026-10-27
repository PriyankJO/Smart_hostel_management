import fs from 'fs';
import path from 'path';

const files = {
  // controllers/studentController.js
  'src/controllers/studentController.js': `
import Student from '../models/Student.js';
import User from '../models/User.js';
import Room from '../models/Room.js';
import { getPaginationOptions, paginateResults } from '../utils/pagination.js';

export const getStudents = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req);
    const search = req.query.search;
    
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { studentId: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const students = await Student.find(query).populate('roomId').skip(skip).limit(limit);
    const pagination = await paginateResults(Student, query, page, limit);

    res.json({ success: true, data: students, pagination });
  } catch (error) { next(error); }
};

export const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).populate('roomId').populate('userId', '-password');
    if (!student) { res.status(404); throw new Error('Student not found'); }
    res.json({ success: true, data: student });
  } catch (error) { next(error); }
};

export const createStudent = async (req, res, next) => {
  try {
    const { studentId, name, course, phone, dob, fatherName, address, roomId } = req.body;
    
    // Create user first
    const user = await User.create({
      username: studentId,
      password: 'Student@123',
      role: 'student',
      name,
      phone,
      dob
    });

    const student = await Student.create({
      studentId, userId: user._id, name, course, phone, dob, fatherName, address, roomId
    });

    if (roomId) {
      const room = await Room.findById(roomId);
      if (room) {
        room.occupied += 1;
        if (room.occupied >= room.capacity) room.status = 'Full';
        room.students.push(student._id);
        await room.save();
      }
    }

    res.status(201).json({ success: true, message: 'Student created', data: student });
  } catch (error) { next(error); }
};

export const updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!student) { res.status(404); throw new Error('Student not found'); }
    res.json({ success: true, message: 'Student updated', data: student });
  } catch (error) { next(error); }
};

export const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) { res.status(404); throw new Error('Student not found'); }
    
    if (student.roomId) {
      const room = await Room.findById(student.roomId);
      if (room) {
        room.occupied = Math.max(0, room.occupied - 1);
        room.status = 'Available';
        room.students = room.students.filter(s => s.toString() !== student._id.toString());
        await room.save();
      }
    }
    
    await User.findByIdAndDelete(student.userId);
    await Student.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'Student deleted' });
  } catch (error) { next(error); }
};
`,

  // controllers/dashboardController.js
  'src/controllers/dashboardController.js': `
import Student from '../models/Student.js';
import Room from '../models/Room.js';
import Fee from '../models/Fee.js';
import Leave from '../models/Leave.js';
import Complaint from '../models/Complaint.js';

export const getAdminDashboard = async (req, res, next) => {
  try {
    const totalStudents = await Student.countDocuments({ status: 'Active' });
    const rooms = await Room.find();
    
    let totalRooms = rooms.length;
    let occupiedRooms = rooms.filter(r => r.occupied > 0).length;
    let totalCapacity = rooms.reduce((acc, r) => acc + r.capacity, 0);
    let totalOccupied = rooms.reduce((acc, r) => acc + r.occupied, 0);
    let availableBeds = totalCapacity - totalOccupied;
    
    const pendingLeaves = await Leave.countDocuments({ status: 'Pending' });
    const openComplaints = await Complaint.countDocuments({ status: 'Open' });
    
    const feesAgg = await Fee.aggregate([
      { $match: { status: { $in: ['Due', 'Overdue'] } } },
      { $group: { _id: null, totalPending: { $sum: "$amount" } } }
    ]);
    
    const collectionsAgg = await Fee.aggregate([
      { $match: { status: 'Paid' } },
      { $group: { _id: null, totalCollected: { $sum: "$amount" } } }
    ]);

    res.json({
      success: true,
      data: {
        totalStudents,
        totalRooms,
        occupiedRooms,
        availableBeds,
        pendingLeaves,
        openComplaints,
        pendingFees: feesAgg[0] ? feesAgg[0].totalPending : 0,
        monthlyCollection: collectionsAgg[0] ? collectionsAgg[0].totalCollected : 0
      }
    });
  } catch (error) { next(error); }
};
`,

  // routes/dashboardRoutes.js
  'src/routes/dashboardRoutes.js': `
import express from 'express';
import { getAdminDashboard } from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/admin', protect, getAdminDashboard);
// Add other dashboards here...

export default router;
`,

  // routes/studentRoutes.js
  'src/routes/studentRoutes.js': `
import express from 'express';
import { getStudents, getStudentById, createStudent, updateStudent, deleteStudent } from '../controllers/studentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getStudents)
  .post(protect, authorize('admin'), createStudent);

router.route('/:id')
  .get(protect, getStudentById)
  .put(protect, authorize('admin'), updateStudent)
  .delete(protect, authorize('admin'), deleteStudent);

export default router;
`
};

Object.entries(files).forEach(([filePath, content]) => {
  fs.writeFileSync(path.join(process.cwd(), filePath), content.trim() + '\\n');
});
console.log('Basic controllers and routes created.');
