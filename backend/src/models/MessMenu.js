import mongoose from 'mongoose';

const messMenuSchema = new mongoose.Schema({
  day: { 
    type: String, 
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    unique: true
  },
  breakfast: { type: String },
  lunch: { type: String },
  dinner: { type: String },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const MessMenu = mongoose.model('MessMenu', messMenuSchema);
export default MessMenu;
