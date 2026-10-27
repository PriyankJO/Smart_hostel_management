import Room from '../models/Room.js';
import RoomHistory from '../models/RoomHistory.js';
import { getPaginationOptions, paginateResults } from '../utils/pagination.js';

export const getRooms = async (req, res, next) => {
  try {
    const search = req.query.search;
    let query = {};
    if (search) { query = { roomNumber: { $regex: search, $options: 'i' } }; }
    
    const rooms = await Room.find(query).populate('students');
    res.json({ success: true, data: rooms });
  } catch (error) { next(error); }
};

export const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id).populate('students');
    if (!room) { res.status(404); throw new Error('Room not found'); }
    res.json({ success: true, data: room });
  } catch (error) { next(error); }
};

export const createRoom = async (req, res, next) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json({ success: true, message: 'Room created', data: room });
  } catch (error) { next(error); }
};

export const updateRoom = async (req, res, next) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!room) { res.status(404); throw new Error('Room not found'); }
    res.json({ success: true, message: 'Room updated', data: room });
  } catch (error) { next(error); }
};

export const deleteRoom = async (req, res, next) => {
  try {
    await Room.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Room deleted' });
  } catch (error) { next(error); }
};