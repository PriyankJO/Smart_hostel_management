import mongoose from 'mongoose';

const roomHistorySchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  previousRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  newRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedAt: { type: Date, default: Date.now },
  reason: { type: String }
}, { timestamps: true });

const RoomHistory = mongoose.model('RoomHistory', roomHistorySchema);
export default RoomHistory;
