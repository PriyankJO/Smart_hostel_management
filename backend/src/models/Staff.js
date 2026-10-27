import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
  staffId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  dob: { type: Date },
  shift: { type: String },
  department: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  joiningDate: { type: Date, default: Date.now }
}, { timestamps: true });

const Staff = mongoose.model('Staff', staffSchema);
export default Staff;
