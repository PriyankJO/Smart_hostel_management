import Staff from '../models/Staff.js';
import User from '../models/User.js';

export const getStaff = async (req, res, next) => {
  try {
    const search = req.query.search;
    let query = {};
    if (search) {
      query = { $or: [{ name: { $regex: search, $options: 'i' } }, { staffId: { $regex: search, $options: 'i' } }] };
    }
    const staff = await Staff.find(query);
    res.json({ success: true, data: staff });
  } catch (error) { next(error); }
};

export const getStaffById = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) { res.status(404); throw new Error('Staff not found'); }
    res.json({ success: true, data: staff });
  } catch (error) { next(error); }
};

export const createStaff = async (req, res, next) => {
  try {
    const { staffId, username, name, role, phone, email, dob, shift } = req.body;
    
    // Map frontend roles to User model enum roles
    let userRole = role;
    if (role === 'canteen_manager') userRole = 'canteen';
    
    const user = await User.create({ username, password: 'Staff@123', role: userRole, name, phone, dob, email });
    const staff = await Staff.create({ staffId, userId: user._id, username, name, role, phone, email, dob, shift });
    res.status(201).json({ success: true, message: 'Staff created', data: staff });
  } catch (error) { next(error); }
};