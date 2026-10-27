import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  block: { type: String, required: true },
  capacity: { type: Number, required: true },
  occupied: { type: Number, default: 0 },
  type: { type: String, enum: ['Single', 'Double Sharing', 'Triple Sharing'], required: true },
  floor: { type: String },
  status: { type: String, enum: ['Available', 'Full', 'Maintenance'], default: 'Available' },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
}, { timestamps: true });

const Room = mongoose.model('Room', roomSchema);
export default Room;
