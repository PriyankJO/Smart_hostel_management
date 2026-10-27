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