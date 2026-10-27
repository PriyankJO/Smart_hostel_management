import mongoose from 'mongoose';

const feeSchema = new mongoose.Schema({
  receiptId: { type: String, required: true, unique: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  amount: { type: Number, required: true },
  dueAmount: { type: Number, default: 0 },
  date: { type: Date, required: true },
  dueDate: { type: Date },
  status: { type: String, enum: ['Paid', 'Due', 'Overdue', 'Partial'], default: 'Due' },
  paymentMethod: { type: String },
  transactionReference: { type: String },
  collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const Fee = mongoose.model('Fee', feeSchema);
export default Fee;
