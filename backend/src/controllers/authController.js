import User from '../models/User.js';
import Student from '../models/Student.js';
import Staff from '../models/Staff.js';
import generateToken from '../utils/generateToken.js';

// @desc    Auth staff & get token
// @route   POST /api/auth/staff/login
// @access  Public
export const authStaff = async (req, res, next) => {
  try {
    const { username, password, role, email } = req.body;

    const user = await User.findOne({ username, role });

    if (user && ((password && await user.matchPassword(password)) || (email && user.email === email))) {
      if (!user.isActive) {
        res.status(401);
        throw new Error('Account is deactivated');
      }

      res.json({
        success: true,
        token: generateToken(user._id, user.role),
        user: {
          id: user._id,
          username: user.username,
          name: user.name,
          role: user.role,
          email: user.email
        }
      });
    } else {
      res.status(401);
      throw new Error('Invalid credentials');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Auth student & get token
// @route   POST /api/auth/student/login
// @access  Public
export const authStudent = async (req, res, next) => {
  try {
    const { studentId, password } = req.body;

    const student = await Student.findOne({ studentId }).populate('userId');

    if (!student || !student.userId) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    const user = student.userId;

    if (await user.matchPassword(password)) {
      if (!user.isActive || student.status !== 'Active') {
        res.status(401);
        throw new Error('Account is deactivated');
      }

      res.json({
        success: true,
        token: generateToken(user._id, user.role),
        user: {
          id: user._id,
          studentId: student.studentId,
          name: student.name,
          role: user.role
        }
      });
    } else {
      res.status(401);
      throw new Error('Invalid credentials');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      let profileData = {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        phone: user.phone
      };

      if (user.role === 'student') {
        const studentInfo = await Student.findOne({ userId: user._id });
        if (studentInfo) {
          profileData.studentId = studentInfo.studentId;
          profileData.roomId = studentInfo.roomId;
        }
      } else {
        const staffInfo = await Staff.findOne({ userId: user._id });
        if (staffInfo) {
          profileData.staffId = staffInfo.staffId;
        }
      }

      res.json({
        success: true,
        data: profileData
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};
