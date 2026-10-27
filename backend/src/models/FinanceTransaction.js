import mongoose from 'mongoose';

const financeTransactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  type: { type: String, enum: ['Income', 'Expense'], required: true },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true, default: Date.now },
  paymentMethod: { 
    type: String, 
    default: 'UPI',
    trim: true
  },
  payerPayee: { type: String, default: '' },
  reference: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['Paid', 'Pending', 'Under Review'], 
    default: 'Paid' 
  },
  notes: { type: String, default: '' },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const FinanceTransaction = mongoose.model('FinanceTransaction', financeTransactionSchema);
export default FinanceTransaction;
