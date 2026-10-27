import fs from 'fs';
import path from 'path';

const files = {
  // controllers/staffController.js
  'src/controllers/staffController.js': `
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
    const user = await User.create({ username, password: 'Staff@123', role, name, phone, dob, email });
    const staff = await Staff.create({ staffId, userId: user._id, username, name, role, phone, email, dob, shift });
    res.status(201).json({ success: true, message: 'Staff created', data: staff });
  } catch (error) { next(error); }
};
`,
  // routes/staffRoutes.js
  'src/routes/staffRoutes.js': `
import express from 'express';
import { getStaff, getStaffById, createStaff } from '../controllers/staffController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('admin', 'warden'), getStaff)
  .post(protect, authorize('admin'), createStaff);

router.route('/:id').get(protect, getStaffById);

export default router;
`,
  // controllers/visitorController.js
  'src/controllers/visitorController.js': `
import Visitor from '../models/Visitor.js';

export const getVisitors = async (req, res, next) => {
  try {
    const visitors = await Visitor.find().populate('studentId', 'name studentId');
    res.json({ success: true, data: visitors });
  } catch (error) { next(error); }
};

export const createVisitor = async (req, res, next) => {
  try {
    const visitor = await Visitor.create({ ...req.body, visitorId: 'VIS-' + Date.now().toString().slice(-4) });
    res.status(201).json({ success: true, data: visitor });
  } catch (error) { next(error); }
};
`,
  // routes/visitorRoutes.js
  'src/routes/visitorRoutes.js': `
import express from 'express';
import { getVisitors, createVisitor } from '../controllers/visitorController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('admin', 'warden', 'staff'), getVisitors)
  .post(protect, authorize('admin', 'warden', 'staff'), createVisitor);

export default router;
`,
  // controllers/noticeController.js
  'src/controllers/noticeController.js': `
import Notice from '../models/Notice.js';

export const getNotices = async (req, res, next) => {
  try {
    const notices = await Notice.find().sort({ date: -1 });
    res.json({ success: true, data: notices });
  } catch (error) { next(error); }
};
`,
  // routes/noticeRoutes.js
  'src/routes/noticeRoutes.js': `
import express from 'express';
import { getNotices } from '../controllers/noticeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.route('/').get(protect, getNotices);
export default router;
`
};

Object.entries(files).forEach(([filePath, content]) => {
  fs.writeFileSync(path.join(process.cwd(), filePath), content.trim() + '\\n');
});
console.log('Controllers 4 created.');
