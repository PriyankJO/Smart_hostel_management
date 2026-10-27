import Student from '../models/Student.js';
import Room from '../models/Room.js';
import Fee from '../models/Fee.js';
import Leave from '../models/Leave.js';
import Complaint from '../models/Complaint.js';
import Notice from '../models/Notice.js';

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
    const recentLeaves = await Leave.find({ status: 'Pending' }).populate('studentId', 'name').limit(5);
    const openComplaints = await Complaint.countDocuments({ status: 'Open' });
    const recentComplaints = await Complaint.find({ status: 'Open' }).populate('studentId', 'name').sort({ date: -1 }).limit(5);
    const recentNotices = await Notice.find().sort({ date: -1 }).limit(5);
    
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
        recentLeaves,
        openComplaints,
        recentComplaints,
        recentNotices,
        pendingFees: feesAgg[0] ? feesAgg[0].totalPending : 0,
        monthlyCollection: collectionsAgg[0] ? collectionsAgg[0].totalCollected : 0
      }
    });
  } catch (error) { next(error); }
};