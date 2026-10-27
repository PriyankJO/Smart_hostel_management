import Notice from '../models/Notice.js';

export const getNotices = async (req, res, next) => {
  try {
    const notices = await Notice.find().sort({ date: -1 });
    res.json({ success: true, data: notices });
  } catch (error) { next(error); }
};