import mongoose from 'mongoose';

const canteenTransactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  date: { type: Date, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  type: { type: String, enum: ['Income', 'Expense'], required: true },
  amount: { type: Number, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const CanteenTransaction = mongoose.model('CanteenTransaction', canteenTransactionSchema);
export default CanteenTransaction;
