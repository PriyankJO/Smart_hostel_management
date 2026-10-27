import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  course: { type: String },
  year: { type: String },
  phone: { type: String },
  dob: { type: Date },
  fatherName: { type: String },
  address: { type: String },
  feeStatus: { type: String, enum: ['Paid', 'Due', 'Overdue'], default: 'Due' },
  attendance: { type: Number, default: 0 },
  admissionDate: { type: Date, default: Date.now },
  dateOfJoining: { type: Date, default: Date.now },
  dateOfVacating: { type: Date, default: null },
  status: { type: String, enum: ['Active', 'Inactive', 'Vacated'], default: 'Active' }
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);
export default Student;
