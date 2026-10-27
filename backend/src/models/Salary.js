import mongoose from 'mongoose';

const salarySchema = new mongoose.Schema({
  salaryId: { type: String, required: true, unique: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  month: { type: String, required: true }, // Format: YYYY-MM
  basic: { type: Number, required: true },
  allowances: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  netPay: { type: Number, required: true },
  status: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' },
  paidOn: { type: Date }
}, { timestamps: true });

// Prevent duplicate salary for same month
salarySchema.index({ staffId: 1, month: 1 }, { unique: true });

const Salary = mongoose.model('Salary', salarySchema);
export default Salary;
