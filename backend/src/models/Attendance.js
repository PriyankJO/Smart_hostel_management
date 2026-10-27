import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  studentCode: { type: String, trim: true },
  studentName: { type: String, trim: true },
  hostelName: { type: String, trim: true, default: 'Main Hostel' },
  roomNumber: { type: String, trim: true },
  date: { type: Date, required: true },
  dateStr: { type: String, required: true }, // Format: YYYY-MM-DD (UTC normalized)
  status: { type: String, enum: ['Present', 'Absent', 'Leave'], required: true },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  remarks: { type: String, default: '', trim: true }
}, { timestamps: true });

// Prevent duplicate attendance for the same student on the same date
attendanceSchema.index({ studentId: 1, dateStr: 1 }, { unique: true });
attendanceSchema.index({ studentCode: 1, dateStr: 1 });
attendanceSchema.index({ dateStr: 1 });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ hostelName: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;

