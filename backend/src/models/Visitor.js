import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema({
  visitorId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  purpose: { type: String, required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Active', 'Checked Out'], default: 'Active' }
}, { timestamps: true });

const Visitor = mongoose.model('Visitor', visitorSchema);
export default Visitor;
