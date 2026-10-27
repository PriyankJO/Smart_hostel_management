import Student from '../models/Student.js';
import User from '../models/User.js';
import Room from '../models/Room.js';
import RoomHistory from '../models/RoomHistory.js';
import Fee from '../models/Fee.js';
import Attendance from '../models/Attendance.js';
import { getPaginationOptions, paginateResults } from '../utils/pagination.js';
import { recalculateStudentOverallRate } from './attendanceController.js';
import { normalizeDateStr, getUtcStartOfDay } from '../utils/attendanceCalculator.js';

export const getStudents = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationOptions(req);
    const search = req.query.search;
    const status = req.query.status;
    
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      query.status = status;
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
    const { studentId, name, course, year, phone, dob, fatherName, address, roomId, feeStatus, dateOfJoining, dateOfVacating } = req.body;
    
    // Create user first
    const user = await User.create({
      username: studentId,
      password: 'Student@123',
      role: 'student',
      name,
      phone,
      dob
    });

    const statusForFee = feeStatus || 'Due';
    const joiningStr = normalizeDateStr(dateOfJoining) || normalizeDateStr(new Date());
    const vacatingStr = dateOfVacating ? normalizeDateStr(dateOfVacating) : null;

    const student = await Student.create({
      studentId, 
      userId: user._id, 
      name, 
      course, 
      year,
      phone, 
      dob, 
      fatherName, 
      address, 
      roomId: vacatingStr ? null : roomId, 
      feeStatus: statusForFee,
      dateOfJoining: getUtcStartOfDay(joiningStr),
      dateOfVacating: vacatingStr ? getUtcStartOfDay(vacatingStr) : null,
      admissionDate: getUtcStartOfDay(joiningStr),
      status: vacatingStr ? 'Vacated' : 'Active'
    });

    if (roomId && !vacatingStr) {
      const room = await Room.findById(roomId);
      if (room) {
        room.occupied += 1;
        if (room.occupied >= room.capacity) room.status = 'Full';
        room.students.push(student._id);
        await room.save();

        await RoomHistory.create({
          studentId: student._id,
          roomId: room._id,
          assignedBy: req.user?._id,
          assignedAt: new Date(),
          reason: 'Initial Room Allocation'
        });
      }
    }

    // Automatically create fee record for specific term
    const defaultFeeAmount = 50000;
    const dueAmount = statusForFee === 'Paid' ? 0 : defaultFeeAmount;
    await Fee.create({
      receiptId: `FEE-${Math.floor(Math.random() * 1000000)}`,
      studentId: student._id,
      amount: defaultFeeAmount,
      dueAmount: dueAmount,
      date: new Date(),
      status: statusForFee
    });

    res.status(201).json({ success: true, message: 'Student created with fee record', data: student });
  } catch (error) { next(error); }
};

export const updateStudent = async (req, res, next) => {
  try {
    const existing = await Student.findById(req.params.id);
    if (!existing) { res.status(404); throw new Error('Student not found'); }

    const updateData = { ...req.body };
    const oldRoomId = existing.roomId ? existing.roomId.toString() : null;

    if (updateData.dateOfJoining) {
      updateData.dateOfJoining = getUtcStartOfDay(normalizeDateStr(updateData.dateOfJoining));
    }

    // Handle vacating / checkout transition
    if (updateData.dateOfVacating) {
      updateData.dateOfVacating = getUtcStartOfDay(normalizeDateStr(updateData.dateOfVacating));
      updateData.status = 'Vacated';
    } else if (updateData.dateOfVacating === "" || updateData.dateOfVacating === null) {
      updateData.dateOfVacating = null;
      if (updateData.status === 'Vacated') {
        updateData.status = 'Active';
      }
    }

    // If student status is being set to Vacated
    const isBecomingVacated = updateData.status === 'Vacated' || Boolean(updateData.dateOfVacating);

    if (isBecomingVacated) {
      updateData.status = 'Vacated';
      if (!updateData.dateOfVacating) {
        updateData.dateOfVacating = getUtcStartOfDay(new Date());
      }
      updateData.attendance = 0;

      // Directly remove all attendance records for vacated student
      await Attendance.deleteMany({
        $or: [
          { studentId: existing._id },
          { studentCode: existing.studentId }
        ]
      });

      // Release existing room if allocated
      if (existing.roomId) {
        const room = await Room.findById(existing.roomId);
        if (room) {
          room.occupied = Math.max(0, room.occupied - 1);
          if (room.status === 'Full') room.status = 'Available';
          room.students = room.students.filter(s => s.toString() !== existing._id.toString());
          await room.save();
        }
        await RoomHistory.create({
          studentId: existing._id,
          roomId: existing.roomId,
          assignedBy: req.user?._id,
          assignedAt: updateData.dateOfVacating,
          reason: 'Hostel Vacated / Checkout'
        });
        updateData.roomId = null;
      }
    } else {
      // Re-admission or Room transfer handling
      const newRoomId = updateData.roomId ? updateData.roomId.toString() : null;
      if (newRoomId && newRoomId !== oldRoomId) {
        // Decrement old room
        if (oldRoomId) {
          const oldRoom = await Room.findById(oldRoomId);
          if (oldRoom) {
            oldRoom.occupied = Math.max(0, oldRoom.occupied - 1);
            if (oldRoom.status === 'Full') oldRoom.status = 'Available';
            oldRoom.students = oldRoom.students.filter(s => s.toString() !== existing._id.toString());
            await oldRoom.save();
          }
        }
        // Increment new room
        const newRoom = await Room.findById(newRoomId);
        if (newRoom) {
          newRoom.occupied += 1;
          if (newRoom.occupied >= newRoom.capacity) newRoom.status = 'Full';
          if (!newRoom.students.includes(existing._id)) {
            newRoom.students.push(existing._id);
          }
          await newRoom.save();

          await RoomHistory.create({
            studentId: existing._id,
            roomId: newRoom._id,
            previousRoom: oldRoomId || undefined,
            newRoom: newRoom._id,
            assignedBy: req.user?._id,
            assignedAt: new Date(),
            reason: oldRoomId ? 'Room Transfer' : 'Re-admission Room Allocation'
          });
        }
      }
    }

    const student = await Student.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('roomId');
    
    // Recalculate attendance stats
    await recalculateStudentOverallRate(student._id);

    res.json({ success: true, message: 'Student updated successfully', data: student });
  } catch (error) { next(error); }
};

/**
 * POST /api/students/:id/checkout
 * Official Hostel Checkout Workflow:
 * 1. Updates student status to 'Vacated'
 * 2. Saves official checkout date (dateOfVacating)
 * 3. Releases room allocation and decrements room occupancy
 * 4. Records entry in RoomHistory
 * 5. Automatically recalculates attendance up to checkout date
 */
export const checkoutStudent = async (req, res, next) => {
  try {
    const { checkoutDate, reason } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) {
      res.status(404);
      throw new Error('Student not found');
    }

    const vacateDateStr = normalizeDateStr(checkoutDate) || normalizeDateStr(new Date());
    const vacateDateUtc = getUtcStartOfDay(vacateDateStr);

    const oldRoomId = student.roomId;

    // 1. Release room if allocated
    if (oldRoomId) {
      const room = await Room.findById(oldRoomId);
      if (room) {
        room.occupied = Math.max(0, room.occupied - 1);
        if (room.status === 'Full') room.status = 'Available';
        room.students = room.students.filter(s => s.toString() !== student._id.toString());
        await room.save();
      }

      await RoomHistory.create({
        studentId: student._id,
        roomId: oldRoomId,
        assignedBy: req.user?._id,
        assignedAt: vacateDateUtc,
        reason: reason || 'Hostel Vacated / Checkout'
      });
    }

    // 2. Update student status, checkout date & reset attendance
    student.dateOfVacating = vacateDateUtc;
    student.status = 'Vacated';
    student.roomId = null;
    student.attendance = 0;
    await student.save();

    // 3. Directly remove all attendance records for vacated student
    const deleteResult = await Attendance.deleteMany({
      $or: [
        { studentId: student._id },
        { studentCode: student.studentId }
      ]
    });

    const updated = await Student.findById(student._id).populate('roomId');

    res.json({
      success: true,
      message: `Student ${student.name} (${student.studentId}) successfully checked out on ${vacateDateStr}. Room released and ${deleteResult.deletedCount} attendance record(s) directly removed.`,
      deletedAttendanceCount: deleteResult.deletedCount,
      data: updated
    });
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
        if (room.status === 'Full') room.status = 'Available';
        room.students = room.students.filter(s => s.toString() !== student._id.toString());
        await room.save();
      }
    }
    
    // Directly delete all attendance records for this student
    await Attendance.deleteMany({
      $or: [
        { studentId: student._id },
        { studentCode: student.studentId }
      ]
    });

    if (student.userId) {
      await User.findByIdAndDelete(student.userId);
    }
    await Student.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'Student and associated attendance records deleted successfully' });
  } catch (error) { next(error); }
};